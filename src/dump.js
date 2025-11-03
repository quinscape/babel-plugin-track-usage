function dump(node)
{
    const buff = []
    dumpRec(node, buff, [], 0);

    fs.writeFileSync("/home/sven/ideaprojects/babel-plugin-track-usage/test/ast.txt", buff.join(""))
}

function indent(buff, depth)
{
    for (let i = 0; i < depth; i++)
    {
        buff.push("    ")
    }
}


const FILTERED_PROPS = {
    "type": true,
    "start": true,
    "end": true,
    "loc": true,
    "source": true
}


function dumpRec(node, buff, visited, depth)
{
    let i
    for (i = 0; i < visited.length; i++)
    {
        if (node === visited[i])
        {
            indent( buff,depth);
            buff.push("*back to ", i, "*\n")
        }
    }
    const id = visited.length
    visited.push(node);


    if (node && typeof node === "object")
    {
        indent(buff, depth);
        buff.push(node.type, "( id=", id, ")\n");
    }

    for (let name in node)
    {
        if (node.hasOwnProperty(name) && FILTERED_PROPS[name])
        {
            continue;
        }

        if (node.hasOwnProperty(name))
        {
            const value = node[name]

            if (Array.isArray(value))
            {
                indent( buff,depth + 1);
                buff.push(name, ": [\n");

                for (i = 0; i < value.length; i++)
                {
                    dumpRec(value[i], buff, visited, depth + 2);
                }
                indent( buff,depth + 1);
                buff.push("]\n");
            }
            else if (value && typeof value === "object")
            {
                indent( buff,depth + 1);
                buff.push(name, ":\n");
                dumpRec(value, buff, visited, depth + 2);
            }
            else
            {
                indent( buff,depth);
                buff.push(name, ": ", JSON.stringify(value), "\n");
            }
        }
    }
}

module.exports = dump;
