import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

export async function GET({params}) {
    function roundNumber(num, scale) {
        if (!("" + num).includes("e")) {
            return +(Math.round(parseInt(num + "e+" + scale)) + "e-" + scale);
        } else {
            var arr = ("" + num).split("e");
            var sig = ""
            if (+arr[1] + scale > 0) {
                sig = "+";
            }
            return +(Math.round(parseInt(+arr[0] + "e" + sig + (+arr[1] + scale))) + "e-" + scale);
        }
    }
    function getPoint(rank) {
        return roundNumber((100 / Math.sqrt(((rank - 1) / 50) + 0.444444)) - 50, 3);
    }
    const supabase = createClient(process.env.API_URL, process.env.API_KEY)
    var { data, error } = await supabase
        .from('dl')
        .select('*')
        .order('top', { ascending: true })
        .range((params.id - 1) * 50, params.id * 50 - 1)
    var d = data
    var res = []
    for(const i in d){
        var { data, error } = await supabase
        .from('levels')
        .select('*')
        .eq('id', d[i].id)
        data[0]['top'] = d[i].top
        console.log()
        data[0]['point'] = getPoint(data[0].top)
        res.push(data[0])
    }

    return {
        status: 200,
        headers: {
            'access-control-allow-origin': '*'
        },
        body: {
            data:res
        }
    };
}