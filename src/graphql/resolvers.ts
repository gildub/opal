import { isMatch, getKey, getProvider, getChildren } from './helpers.js';
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
    hosts: (_, { filter }, { dataSources }) => dataSources.inventoryAPI.getHosts(filter),
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
      if (obj.kind === 'DVPortGroup') return 'DVPortGroup';
      if (obj.kind === 'DVSwitch') return 'DVSwitch';
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
  NetworkGroup: {
    __resolveType(obj) {
      if (obj.kind === 'Network') return 'Network';
      if (obj.kind === 'DVPortGroup') return 'DVPortGroup';
      if (obj.kind === 'DVSwitch') return 'DVSwitch';
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
      const children = await getChildren(folder.id, dataSources);
      return children;
    },
  },
  Provider: {
    datacenters: async (provider, _, { dataSources }) => {
      const result = await dataSources.inventoryAPI.getDatacentersByProvider(provider.name);
      return result.filter((e) => e != null);
    },
  },
  Datacenter: {
    clusters: async (datacenter, _, { dataSources }) => {
      const folderId = `${datacenter.clusters.id}.${getProvider(datacenter.id)}`;
      return await getChildren(folderId, dataSources, true);
    },
    datastores: async (datacenter, _, { dataSources }) => {
      const folderId = `${datacenter.datastores.id}.${getProvider(datacenter.id)}`;
      return await getChildren(folderId, dataSources, true);
    },
    networks: async (datacenter, _, { dataSources }) => {
      const folderId = `${datacenter.networks.id}.${getProvider(datacenter.id)}`;
      return await getChildren(folderId, dataSources, true);
    },
    vms: async (datacenter, _, { dataSources }) => {
      const folderId = `${datacenter.vms.id}.${getProvider(datacenter.id)}`;
      return await getChildren(folderId, dataSources, true);
    },
  },
  Cluster: {
    hosts: async (cluster, _, { dataSources }) => {
      const provider = getProvider(cluster.id);
      const ids = cluster.hosts.map((host) => `${host.id}.${provider}`);
      const hosts = await dataSources.inventoryAPI.getHostsByIds(ids);
      return hosts;
    },
    networks: async (cluster, filter, { dataSources }) => {
      const provider = getProvider(cluster.id);
      const ids = cluster.networks.map((network) => `${network.id}.${provider}`);
      const networks = await dataSources.inventoryAPI.getNetworksByIds(ids, filter);
      return networks.filter((e) => e != null);
    },
    datastores: async (cluster, filter, { dataSources }) => {
      const provider = getProvider(cluster.id);
      const ids = cluster.datastores.map((datastore) => `${datastore.id}.${provider}`);
      const datastores = await dataSources.inventoryAPI.getDatastoresByIds(ids, filter);
      return datastores.filter((e) => e != null);
    },
  },
  Datastore: {
    // Inventory API: Datastore resource doesn't provide Hosts directly
    hosts: async (datastore, _, { dataSources }) => {
      const allHosts = await dataSources.inventoryAPI.getHosts();
      return allHosts.filter(
        (host) =>
          host.provider === getProvider(datastore.id) &&
          host.datastores.find((datastore) => datastore.id === getKey(datastore.id))
      );
    },
    // Inventory API: Datastore resource doesn't provide VMs directly
    vms: async (datastore, _, { dataSources }) => {
      const datastoreId = getKey(datastore.id);
      const provider = getProvider(datastore.id);
      const allVMs = await dataSources.inventoryAPI.getVMs();
      return allVMs.filter(
        (vm) =>
          getProvider(vm.id) === provider &&
          vm.disks.find((disk) => disk.datastore.id === datastoreId)
      );
    },
  },
  Host: {
    cluster: async (host, filter, { dataSources }) => {
      const response = await dataSources.inventoryAPI.getCluster(
        `${host.cluster.id}.${getProvider(host.id)}`,
        filter
      );
      return response;
    },
    datastores: async (host, filter, { dataSources }) => {
      const provider = getProvider(host.id);
      const ids = host.datastores.map((datastore) => `${datastore.id}.${provider}`);
      const datastores = await dataSources.inventoryAPI.getDatastoresByIds(ids, filter);
      return datastores.filter((e) => e != null);
    },
    networks: async (host, filter, { dataSources }) => {
      const provider = getProvider(host.id);
      const ids = host.networks.map((network) => `${network.id}.${provider}`);
      const networks = await dataSources.inventoryAPI.getNetworksByIds(ids, filter);
      return networks.filter((e) => e != null);
    },
    vms: async (host, filter, { dataSources }) => {
      const ids = host.vms.map((vm) => `${vm.id}.${getProvider(host.id)}`);
      const vms = await dataSources.inventoryAPI.getVMsByIds(ids, filter);
      return vms.filter((e) => e != null);
    },
  },
  VM: {
    concerns: (vm, filter) => {
      return vm.concerns.filter((concern) => isMatch(concern, filter));
    },
    host: async (vm, filter, { dataSources }) => {
      const hostId = filter.id ? filter.id : `${vm.host}.${getProvider(vm.id)}`;
      const response = await dataSources.inventoryAPI.getHost(hostId);
      return response;
    },
    networks: async (vm, filter, { dataSources }) => {
      const ids = vm.networks.map((network) => `${network.id}.${getProvider(vm.id)}`);
      const result = await dataSources.inventoryAPI.getNetworksByIds(ids, filter);
      return result.filter((e) => e != null);
    },
  },
};

export default resolvers;
