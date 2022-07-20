import { createClient } from '@supabase/supabase-js'

export async function GET({params}) {
    const supabase = createClient('https://qdwpenfblwdmhywwszzj.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkd3BlbmZibHdkbWh5d3dzenpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NTgzMTk1ODEsImV4cCI6MTk3Mzg5NTU4MX0.b_j2bXu26CYSCMDPei6vGGm9P_QG3I-LsB8OBPm0ZOg')
    const { data, error } = await supabase
        .from('levels')
        .select('*')
        .eq('id', params.id).single()

    return {
        status: 200,
        headers: {
            'access-control-allow-origin': '*'
        },
        body: {
            data: data
        }
    };

}