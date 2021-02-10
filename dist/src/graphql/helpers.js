export const isMatch = (vm, filter) => {
    let noMatch = true;
    for (let [k, v] of Object.entries(filter)) {
        if (typeof v === 'string') {
            const reg = new RegExp(v);
            if (!vm[k].match(reg))
                noMatch = false;
        }
        else if (vm[k] !== v)
            noMatch = false;
    }
    return noMatch;
};
export const getFilters = (filter) => {
    const newFilters = {};
    for (const [k, v] of Object.entries(filter)) {
        if (v !== undefined)
            newFilters[k] = v;
    }
    return newFilters;
};
//# sourceMappingURL=helpers.js.map