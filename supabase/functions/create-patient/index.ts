import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Method not allowed',
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  try {
    // ------------------------------------
    // 1. Get request body
    // ------------------------------------

    const body = await req.json();

    const {
      id_number,
      first_name,
      last_name,
      date_of_birth,
      gender,
      phone_number,
      address,
      emergency_contact_name,
      emergency_contact_phone,
    } = body;

    // ------------------------------------
    // 2. Validate required fields
    // ------------------------------------

    if (!id_number) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'ID number is required',
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (!first_name) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'First name is required',
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (!last_name) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Last name is required',
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // ------------------------------------
    // 3. Create Supabase client
    // ------------------------------------

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: {
            Authorization:
              req.headers.get('Authorization') ?? '',
          },
        },
      }
    );

    // ------------------------------------
    // 4. Verify logged-in user
    // ------------------------------------

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized',
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // ------------------------------------
    // 5. Create patient
    // ------------------------------------

    const { data, error } = await supabase
      .from('patients')
      .insert({
        id_number,
        first_name,
        last_name,
        date_of_birth: date_of_birth ?? null,
        gender: gender ?? null,
        phone_number: phone_number ?? null,
        address: address ?? null,
        emergency_contact_name:
          emergency_contact_name ?? null,
        emergency_contact_phone:
          emergency_contact_phone ?? null,
      })
      .select()
      .single();

    // ------------------------------------
    // 6. Database error
    // ------------------------------------

    if (error) {
      console.error('CREATE PATIENT ERROR:', error);

      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // ------------------------------------
    // 7. Success
    // ------------------------------------

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Patient created successfully',
        patient: data,
      }),
      {
        status: 201,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('API ERROR:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Invalid request',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});