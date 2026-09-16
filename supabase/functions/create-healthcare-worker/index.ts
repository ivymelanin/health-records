// @ts-expect-error Deno resolves npm: specifiers at runtime; local TypeScript tooling may not.
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const jsonResponse = (
  body: Record<string, unknown>,
  status: number
) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
};

declare const Deno: {
  env: any;
  serve(
    handler: (req: Request) => Response | Promise<Response>
  ): void;
};

Deno.serve(async (req) => {
  // ------------------------------------
  // 1. CORS
  // ------------------------------------

  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    });
  }

  // ------------------------------------
  // 2. Only POST is allowed
  // ------------------------------------

  if (req.method !== 'POST') {
    return jsonResponse(
      {
        success: false,
        error: 'Method not allowed',
      },
      405
    );
  }

  try {
    // ------------------------------------
    // 3. Get authorization token
    // ------------------------------------

    const authorization = req.headers.get('Authorization');

    if (!authorization) {
      return jsonResponse(
        {
          success: false,
          error: 'Authorization token is required.',
        },
        401
      );
    }

    // ------------------------------------
    // 4. Environment variables
    // ------------------------------------

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceRoleKey = Deno.env.get(
      'SUPABASE_SERVICE_ROLE_KEY'
    );

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      !supabaseServiceRoleKey
    ) {
      console.error(
        'Missing required Supabase environment variables.'
      );

      return jsonResponse(
        {
          success: false,
          error: 'Server configuration error.',
        },
        500
      );
    }

    // ------------------------------------
    // 5. Client using logged-in user's token
    // ------------------------------------

    const userClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: authorization,
          },
        },
      }
    );

    // ------------------------------------
    // 6. Verify logged-in user
    // ------------------------------------

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      console.error(
        'AUTH ERROR:',
        userError?.message
      );

      return jsonResponse(
        {
          success: false,
          error: 'Unauthorized. Please log in again.',
        },
        401
      );
    }

    console.log(
      'CREATE HEALTHCARE WORKER REQUEST FROM:',
      user.id
    );

    // ------------------------------------
    // 7. Service-role client
    //
    // IMPORTANT:
    // This key remains inside the Edge Function.
    // It is never sent to the frontend.
    // ------------------------------------

    const adminClient = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // ------------------------------------
    // 8. Get current user's profile
    // ------------------------------------

    const {
      data: currentProfile,
      error: currentProfileError,
    } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (currentProfileError) {
      console.error(
        'CURRENT PROFILE ERROR:',
        currentProfileError
      );

      return jsonResponse(
        {
          success: false,
          error:
            'Unable to verify your account permissions.',
        },
        500
      );
    }

    if (!currentProfile) {
      return jsonResponse(
        {
          success: false,
          error:
            'Your user profile could not be found.',
        },
        403
      );
    }

    const currentRole =
      typeof currentProfile.role === 'string'
        ? currentProfile.role.toLowerCase().trim()
        : '';

    console.log(
      'CURRENT USER PROFILE ROLE:',
      currentRole
    );

    // ------------------------------------
    // 9. Verify HR role
    // ------------------------------------

    if (currentRole !== 'hr') {
      console.warn(
        'CREATE HEALTHCARE WORKER DENIED:',
        user.id,
        'ROLE:',
        currentRole
      );

      return jsonResponse(
        {
          success: false,
          error:
            'Forbidden. Only HR users can create healthcare workers.',
        },
        403
      );
    }

    // ------------------------------------
    // 10. Verify manage_users permission
    // ------------------------------------

    const {
      data: manageUsersPermission,
      error: permissionError,
    } = await adminClient
      .from('role_permissions')
      .select(`
        role_id,
        permissions (
          name
        )
      `)
      .eq(
        'role_id',
        (
          await adminClient
            .from('roles')
            .select('id')
            .eq('name', 'hr')
            .maybeSingle()
        ).data?.id ?? ''
      );

    if (permissionError) {
      console.error(
        'PERMISSION ERROR:',
        permissionError
      );

      return jsonResponse(
        {
          success: false,
          error:
            'Unable to verify your account permissions.',
        },
        500
      );
    }

    const hasManageUsersPermission =
      (manageUsersPermission ?? []).some(
        (item: any) =>
          item.permissions?.name === 'manage_users'
      );

    if (!hasManageUsersPermission) {
      console.warn(
        'MANAGE USERS PERMISSION DENIED:',
        user.id
      );

      return jsonResponse(
        {
          success: false,
          error:
            'Forbidden. You do not have permission to create healthcare workers.',
        },
        403
      );
    }

    // ------------------------------------
    // 11. Read request body
    // ------------------------------------

    let body: Record<string, unknown>;

    try {
      body = await req.json();
    } catch {
      return jsonResponse(
        {
          success: false,
          error: 'Invalid JSON request body.',
        },
        400
      );
    }

    // ------------------------------------
    // 12. Extract fields
    // ------------------------------------

    const firstName =
      typeof body.first_name === 'string'
        ? body.first_name.trim()
        : '';

    const lastName =
      typeof body.last_name === 'string'
        ? body.last_name.trim()
        : '';

    const email =
      typeof body.email === 'string'
        ? body.email.trim().toLowerCase()
        : '';

    const password =
      typeof body.password === 'string'
        ? body.password
        : '';

    const requestedRole =
      typeof body.role === 'string'
        ? body.role.trim().toLowerCase()
        : '';

    const department =
      typeof body.department === 'string' &&
      body.department.trim()
        ? body.department.trim()
        : null;

    const facilityId =
      typeof body.facility_id === 'string'
        ? body.facility_id.trim()
        : '';

    // ------------------------------------
    // 13. Validate required fields
    // ------------------------------------

    if (!firstName) {
      return jsonResponse(
        {
          success: false,
          error: 'First name is required.',
        },
        400
      );
    }

    if (!lastName) {
      return jsonResponse(
        {
          success: false,
          error: 'Last name is required.',
        },
        400
      );
    }

    if (!email) {
      return jsonResponse(
        {
          success: false,
          error: 'Email is required.',
        },
        400
      );
    }

    if (!password) {
      return jsonResponse(
        {
          success: false,
          error: 'Password is required.',
        },
        400
      );
    }

    if (password.length < 6) {
      return jsonResponse(
        {
          success: false,
          error:
            'Password must contain at least 6 characters.',
        },
        400
      );
    }

    if (!requestedRole) {
      return jsonResponse(
        {
          success: false,
          error: 'Healthcare worker role is required.',
        },
        400
      );
    }

    if (!facilityId) {
      return jsonResponse(
        {
          success: false,
          error: 'Facility is required.',
        },
        400
      );
    }

    // ------------------------------------
    // 14. Only clinical worker roles allowed
    // ------------------------------------

    const allowedWorkerRoles = [
      'doctor',
      'laboratory',
      'nurse',
      'paramedic',
      'pharmacist',
      'radiology',
    ];

    if (!allowedWorkerRoles.includes(requestedRole)) {
      return jsonResponse(
        {
          success: false,
          error:
            'Invalid healthcare worker role.',
        },
        400
      );
    }

    // ------------------------------------
    // 15. Find selected role
    // ------------------------------------

    const {
      data: workerRole,
      error: workerRoleError,
    } = await adminClient
      .from('roles')
      .select('id, name')
      .eq('name', requestedRole)
      .maybeSingle();

    if (workerRoleError) {
      console.error(
        'WORKER ROLE ERROR:',
        workerRoleError
      );

      return jsonResponse(
        {
          success: false,
          error:
            'Unable to verify the selected healthcare worker role.',
        },
        500
      );
    }

    if (!workerRole) {
      return jsonResponse(
        {
          success: false,
          error:
            'The selected healthcare worker role does not exist.',
        },
        400
      );
    }

    // ------------------------------------
    // 16. Verify facility
    // ------------------------------------

    const {
      data: facility,
      error: facilityError,
    } = await adminClient
      .from('facilities')
      .select('id, name, active')
      .eq('id', facilityId)
      .maybeSingle();

    if (facilityError) {
      console.error(
        'FACILITY ERROR:',
        facilityError
      );

      return jsonResponse(
        {
          success: false,
          error:
            'Unable to verify the selected facility.',
        },
        500
      );
    }

    if (!facility) {
      return jsonResponse(
        {
          success: false,
          error: 'Selected facility was not found.',
        },
        400
      );
    }

    if (facility.active === false) {
      return jsonResponse(
        {
          success: false,
          error:
            'The selected facility is not active.',
        },
        400
      );
    }

    // ------------------------------------
    // 17. Create Auth user
    // ------------------------------------

    const {
      data: createdUser,
      error: createUserError,
    } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (createUserError || !createdUser.user) {
      console.error(
        'CREATE AUTH USER ERROR:',
        createUserError
      );

      if (
        createUserError?.message
          ?.toLowerCase()
          .includes('already')
      ) {
        return jsonResponse(
          {
            success: false,
            error:
              'A user with this email address already exists.',
          },
          409
        );
      }

      return jsonResponse(
        {
          success: false,
          error:
            createUserError?.message ||
            'Unable to create healthcare worker account.',
        },
        400
      );
    }

    const workerUserId = createdUser.user.id;

    console.log(
      'AUTH USER CREATED:',
      workerUserId
    );

    // ------------------------------------
    // 18. Update trigger-created profile
    // ------------------------------------

    const {
      data: updatedProfile,
      error: profileUpdateError,
    } = await adminClient
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        role: requestedRole,
      })
      .eq('id', workerUserId)
      .select()
      .maybeSingle();

    if (profileUpdateError || !updatedProfile) {
      console.error(
        'PROFILE UPDATE ERROR:',
        profileUpdateError
      );

      // Roll back Auth user if profile setup failed.
      await adminClient.auth.admin.deleteUser(
        workerUserId
      );

      return jsonResponse(
        {
          success: false,
          error:
            'Unable to create the healthcare worker profile.',
        },
        500
      );
    }

    // ------------------------------------
    // 19. Create facility_staff record
    // ------------------------------------

    const {
      data: staffRecord,
      error: staffError,
    } = await adminClient
      .from('facility_staff')
      .insert({
        user_id: workerUserId,
        facility_id: facilityId,
        role: requestedRole,
        role_id: workerRole.id,
        department,
        active: true,
        start_date: new Date()
          .toISOString()
          .split('T')[0],
      })
      .select()
      .single();

    if (staffError || !staffRecord) {
      console.error(
        'FACILITY STAFF INSERT ERROR:',
        staffError
      );

      // Roll back Auth user if facility staff
      // creation failed.
      await adminClient.auth.admin.deleteUser(
        workerUserId
      );

      return jsonResponse(
        {
          success: false,
          error:
            staffError?.message ||
            'Unable to assign healthcare worker to the facility.',
        },
        500
      );
    }

    // ------------------------------------
    // 20. Success
    // ------------------------------------

    console.log(
      'HEALTHCARE WORKER CREATED SUCCESSFULLY:',
      workerUserId
    );

    return jsonResponse(
      {
        success: true,
        message:
          'Healthcare worker created successfully.',
        healthcare_worker: {
          id: workerUserId,
          staff_id: staffRecord.id,
          first_name: firstName,
          last_name: lastName,
          email,
          role: requestedRole,
          department,
          facility_id: facilityId,
          facility_name: facility.name,
          active: true,
        },
      },
      201
    );
  } catch (error) {
    console.error(
      'CREATE HEALTHCARE WORKER API ERROR:',
      error
    );

    return jsonResponse(
      {
        success: false,
        error:
          'An unexpected error occurred while creating the healthcare worker.',
      },
      500
    );
  }
});