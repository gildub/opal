import fs from 'fs';

export const isMatch = (vm, filter) => {
  let noMatch = true;
  for (const [k, v] of Object.entries(filter)) {
    if (typeof v === 'string') {
      const reg = new RegExp(v);
      if (!vm[k].match(reg)) noMatch = false;
    } else if (vm[k] !== v) noMatch = false;
  }
  return noMatch;
};

export const getFilters = (filter) => {
  const newFilters = {};
  for (const [k, v] of Object.entries(filter)) {
    if (v !== undefined) newFilters[k] = v;
  }
  return newFilters;
};

export const getProvider = (id: string): unknown => id.split('.')[1];
export const getKey = (id: string): unknown => id.split('.')[0];

export const getChildren = async (folderId, dataSources, flatten = false): Promise<unknown[]> => {
  const response = await dataSources.inventoryAPI.getFolder(folderId);
  const children = response.children.map((child) => {
    const childId = `${child.id}.${getProvider(folderId)}`;
    if (child.kind === 'Folder') {
      return flatten
        ? getChildren(childId, dataSources)
        : dataSources.inventoryAPI.getFolder(childId);
    }
    if (child.kind === 'Datacenter') return dataSources.inventoryAPI.getDatacenter(childId);
    if (child.kind === 'Cluster') return dataSources.inventoryAPI.getCluster(childId);
    if (child.kind === 'Datastore') return dataSources.inventoryAPI.getDatastore(childId);
    if (/Network|DVPortGroup|DVSwitch/.test(child.kind))
      return dataSources.inventoryAPI.getNetwork(childId);
    if (child.kind === 'VM') return dataSources.inventoryAPI.getVM(childId);
  });

  const kids = await Promise.all(children);
  return kids.filter((e) => !!e).flat();
};
