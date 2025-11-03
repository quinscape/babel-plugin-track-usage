
export function thing(...names: any[] ): number {
    return 0;
}

export function nonvar(name : string ): number {
    return 1;
}

const lookup = {

    thing: function(...names: any[] ): number {
        return 2;
    },
    nonvar: function(name : string ): number {
        return 3;
    }
}

export default lookup;

