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

export const getProvider = (vmId: string): unknown => vmId.split('.')[1];

export const getChildren = async (folderId, dataSources): Promise<unknown[]> => {
  const response = await dataSources.inventoryAPI.getFolder(folderId);
  const children = response.children.map((child) => {
    const childId = `${child.id}.${getProvider(folderId)}`;
    if (child.kind === 'Folder') return getChildren(childId, dataSources);
    if (child.kind === 'VM') return dataSources.inventoryAPI.getVM(childId);
    if (child.kind === 'Cluster') return dataSources.inventoryAPI.getCluster(childId);
    if (child.kind === 'Datastore') return dataSources.inventoryAPI.getDatastore(childId);
    if (child.kind === 'Network') return dataSources.inventoryAPI.getNetwork(childId);
  });

  const kids = await Promise.all(children);
  return kids.filter((e) => !!e).flat();
};
