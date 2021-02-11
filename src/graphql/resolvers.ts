import { isMatch } from './helpers.js';
import { Provider } from './inventory.js';

const resolvers = {
  Query: {
    folders: (_, { provider }, { dataSources }) => dataSources.inventoryAPI.getFolders(provider),
    folder: (_, { provider, id }, { dataSources }) =>
      dataSources.inventoryAPI.getFolder(provider, id),
    providers: (_, __, { dataSources }): Provider[] => dataSources.inventoryAPI.getProviders(),
    provider: (_, { name }, { dataSources }) => dataSources.inventoryAPI.getProvider(name),
    datacenters: (_, { provider }, { dataSources }) =>
      dataSources.inventoryAPI.getDatacenters(provider),
    datacenter: (_, { provider, id }, { dataSources }) =>
      dataSources.inventoryAPI.getDatacenter(provider, id),
    clusters: (_, { provider }, { dataSources }) => dataSources.inventoryAPI.getClusters(provider),
    cluster: (_, { provider, id }, { dataSources }) =>
      dataSources.inventoryAPI.getCluster(provider, id),
    datastores: (_, { provider }, { dataSources }) =>
      dataSources.inventoryAPI.getDatastores(provider),
    datastore: (_, { provider, id }, { dataSources }) =>
      dataSources.inventoryAPI.getDatastore(provider, id),
    hosts: (_, { provider }, { dataSources }) => dataSources.inventoryAPI.getHosts(provider),
    host: (_, { provider, id }, { dataSources }) => dataSources.inventoryAPI.getHost(provider, id),
    networks: (_, { provider, filter }, { dataSources }) =>
      dataSources.inventoryAPI.getNetworks(provider, filter),
    network: (_, { provider, id }, { dataSources }) =>
      dataSources.inventoryAPI.getNetwork(provider, id),
    vm: (_, { provider, id }, { dataSources }) => dataSources.inventoryAPI.getVM(provider, id),
    vms: (_, { provider, filter }, { dataSources }) =>
      dataSources.inventoryAPI.getVMs(provider, filter),
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
      const children = [];
      Promise.all(
        folder.children.map((child) => {
          // if (child.kind === 'Folder')
          //   children.push(dataSources.inventoryAPI.getFolder(folder.provider, child.id));
          // if (child.kind === 'Datacenter') {
          //   children.push(dataSources.inventoryAPI.getDatacenter(folder.provider, child.id));
          // }
          // if (child.kind === 'Cluster')
          //   children.push(dataSources.inventoryAPI.getCluster(folder.provider, child.id));
          // if (child.kind === 'Datastore')
          //   children.push(dataSources.inventoryAPI.getDatastore(folder.provider, child.id));
          // // if (child.kind === 'Network') children.push(dataSources.inventoryAPI.getNetwork(folder.provider, child.id));
          // if (child.kind === 'VM')
          //   children.push(dataSources.inventoryAPI.getVM(folder.provider, child.id));
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
      const response = await dataSources.inventoryAPI.getFolder(
        datacenter.provider,
        datacenter.clusters.id
      );
      const children: string[] = [];
      Promise.all(
        response.children.map((child) => {
          if (child.kind === 'Cluster')
            children.push(dataSources.inventoryAPI.getCluster(datacenter.provider, child.id));
        })
      );
      return children;
    },
    vms: async (datacenter, _, { dataSources }) => {
      const response = await dataSources.inventoryAPI.getFolder(
        datacenter.provider,
        datacenter.vms.id
      );
      const children: string[] = [];
      Promise.all(
        response.children.map((child) => {
          if (child.kind === 'VM')
            children.push(dataSources.inventoryAPI.getVM(datacenter.provider, child.id));
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
      const response = await dataSources.inventoryAPI.getHost(vm.provider, hostId);
      return response;
    },
    networks: async (vm, filter, { dataSources }) => {
      const ids = vm.networks.map((e) => e.id);
      const result = await dataSources.inventoryAPI.getNetworksByIds(vm.provider, ids, filter);
      return result.filter((e) => e != null);
    },
  },
};

export default resolvers;
