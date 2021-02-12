import { isMatch, getProvider } from './helpers.js';
import { Provider } from './inventory.js';

const resolvers = {
  Query: {
    folders: (_, __, { dataSources }) => dataSources.inventoryAPI.getFolders(),
    folder: (_, { id }, { dataSources }) => dataSources.inventoryAPI.getFolder(id),
    providers: (_, __, { dataSources }): Provider[] => dataSources.inventoryAPI.getProviders(),
    provider: (_, { name }, { dataSources }) => dataSources.inventoryAPI.getProvider(name),
    datacenters: (_, __, { dataSources }) => dataSources.inventoryAPI.getDatacenters(),
    datacenter: (_, { id }, { dataSources }) => dataSources.inventoryAPI.getDatacenter(id),
    clusters: (_, __, { dataSources }) => dataSources.inventoryAPI.getClusters(),
    cluster: (_, { id }, { dataSources }) => dataSources.inventoryAPI.getCluster(id),
    datastores: (_, __, { dataSources }) => dataSources.inventoryAPI.getDatastores(),
    datastore: (_, { id }, { dataSources }) => dataSources.inventoryAPI.getDatastore(id),
    hosts: (_, __, { dataSources }) => dataSources.inventoryAPI.getHosts(),
    host: (_, { id }, { dataSources }) => dataSources.inventoryAPI.getHost(id),
    networks: (_, { filter }, { dataSources }) => dataSources.inventoryAPI.getNetworks(filter),
    network: (_, { id }, { dataSources }) => dataSources.inventoryAPI.getNetwork(id),
    vm: (_, { id }, { dataSources }) => dataSources.inventoryAPI.getVM(id),
    vms: (_, { filter }, { dataSources }) => dataSources.inventoryAPI.getVMs(filter),
  },
  FolderGroup: {
    __resolveType(obj) {
      if (obj.kind === 'Folder') return 'Folder';
      if (obj.kind === 'Datacenter') return 'Datacenter';
      if (obj.kind === 'Cluster') return 'Cluster';
      if (obj.kind === 'Datastore') return 'Datastore';
      if (obj.kind === 'Network') return 'Network';
      if (obj.kind === 'VM') return 'VM';
      return null;
    },
  },
  ClusterGroup: {
    __resolveType(obj) {
      if (obj.kind === 'Folder') return 'Folder';
      if (obj.kind === 'Cluster') return 'Cluster';
      return null;
    },
  },
  VMGroup: {
    __resolveType(obj) {
      if (obj.kind === 'Folder') return 'Folder';
      if (obj.kind === 'VM') return 'VM';
      return null;
    },
  },
  Folder: {
    children: async (folder, _, { dataSources }) => {
      const children: string[] = [];
      Promise.all(
        folder.children.map((child) => {
          console.log(child);
          if (child.kind === 'Folder') children.push(dataSources.inventoryAPI.getFolder(child.id));
          if (child.kind === 'Datacenter') {
            children.push(dataSources.inventoryAPI.getDatacenter(child.id));
          }
          if (child.kind === 'Cluster')
            children.push(dataSources.inventoryAPI.getCluster(child.id));
          if (child.kind === 'Datastore')
            children.push(dataSources.inventoryAPI.getDatastore(child.id));
          // if (child.kind === 'Network') children.push(dataSources.inventoryAPI.getNetwork(child.id));
          if (child.kind === 'VM') children.push(dataSources.inventoryAPI.getVM(child.id));
        })
      );
      return children;
    },
  },
  Provider: {
    datacenters: async (provider, _, { dataSources }) => {
      const result = await dataSources.inventoryAPI.getDatacenters(provider.name);
      return result.filter((e) => e != null);
    },
  },
  Datacenter: {
    clusters: async (datacenter, _, { dataSources }) => {
      const folderId = `${datacenter.clusters.id}.${getProvider(datacenter.id)}`;
      const response = await dataSources.inventoryAPI.getFolder(folderId);
      const children: string[] = [];
      Promise.all(
        response.children.map((child) => {
          const childId = `${child.id}.${getProvider(datacenter.id)}`;
          if (child.kind === 'Cluster') children.push(dataSources.inventoryAPI.getCluster(childId));
          if (child.kind === 'Folder') children.push(dataSources.inventoryAPI.getFolder(childId));
        })
      );
      return children;
    },
    vms: async (datacenter, _, { dataSources }) => {
      const folderId = `${datacenter.vms.id}.${getProvider(datacenter.id)}`;
      console.log(folderId);
      const response = await dataSources.inventoryAPI.getFolder(folderId);
      const children: string[] = [];
      Promise.all(
        response.children.map((child) => {
          const vmId = `${child.id}.${getProvider(datacenter.id)}`;
          if (child.kind === 'VM') children.push(dataSources.inventoryAPI.getVM(vmId));
        })
      );
      return children;
    },
  },
  Cluster: {
    datastores: async (cluster, filter, { dataSources }) => {
      const ids = cluster.datastores.map((e) => e.id);
      const result = await dataSources.inventoryAPI.getDatastores(cluster.provider, ids, filter);
      return result.filter((e) => e != null);
    },
  },
  Host: {
    vms: async (host, filter, { dataSources }) => {
      const ids = host.vms.map((e) => e.id);
      const result = await dataSources.inventoryAPI.getVMsByIds(host.provider, ids, filter);
      return result.filter((e) => e != null);
    },
  },
  VM: {
    concerns: (vm, filter) => {
      return vm.concerns.filter((concern) => isMatch(concern, filter));
    },
    host: async (vm, { id }, { dataSources }) => {
      const hostId = id ? id : vm.hostId;
      const response = await dataSources.inventoryAPI.getHost(getProvider(vm.id), hostId);
      return response;
    },
    networks: async (vm, filter, { dataSources }) => {
      const ids = vm.networks.map((e) => e.id);
      const result = await dataSources.inventoryAPI.getNetworksByIds(
        getProvider(vm.id),
        ids,
        filter
      );
      return result.filter((e) => e != null);
    },
  },
};

export default resolvers;
