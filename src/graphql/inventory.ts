import { RESTDataSource } from 'apollo-datasource-rest';
import { isMatch, getFilters } from './helpers.js';
import { inventoryAPIs, API } from './discovery.js';

// TODO: use typegraphql.com approach to benefit from single source
// of truth for type definition from graphql.
export type Provider = {
  id: string;
  name: string;
  kind: string;
  product: string;
};

class inventoryAPI extends RESTDataSource {
  APIs: API[];

  constructor() {
    super();
    this.APIs = inventoryAPIs;
  }

  getURL(): string {
    const resourceBase = `namespaces/${this.APIs[0].namespace}/providers/vsphere`;
    // TODO: Handle multi vsphere inventory case
    return `${this.APIs[0].url}/${resourceBase}`;
  }

  async getProviders() {
    const response = await this.get(`${this.getURL()}?detail=1`);
    return Array.isArray(response)
      ? response.map((provider) => this.providerReducer(provider))
      : [];
  }

  async getProvider(name) {
    const response = await this.get(`${this.getURL()}/${name}`);
    return this.providerReducer(response);
  }

  providerReducer(provider): Provider {
    return {
      id: provider.uid,
      name: provider.name,
      kind: 'Provider',
      product: provider.product,
    };
  }

  async getFolders() {
    const providers = await this.getProviders();
    const result = Promise.all(
      providers.map((provider) => this.getFoldersByProvider(provider.name))
    );
    return (await result).flat();
  }

  async getFoldersByProvider(provider) {
    const response = await this.get(`${this.getURL()}/${provider}/folders?detail=1`);
    return Array.isArray(response)
      ? response.map((folder) => this.folderReducer(provider, folder))
      : [];
  }

  async getFolder(id) {
    const [key, provider] = id.split('.');
    const response = await this.get(`${this.getURL()}/${provider}/folders/${key}`);
    return this.folderReducer(provider, response);
  }

  async getFoldersByIds(provider, ids, filter = {}) {
    return Promise.all(ids.map((id) => this.getFolder(id)));
  }

  folderReducer(provider, folder) {
    return {
      id: `${folder.id}.${provider}`,
      kind: 'Folder',
      name: folder.name,
      parent: folder.parent,
      children: folder.children,
    };
  }

  async getDatacenters() {
    const providers = await this.getProviders();
    const result = Promise.all(
      providers.map((provider) => this.getDatacentersByProvider(provider.name))
    );
    return (await result).flat();
  }

  async getDatacentersByProvider(provider) {
    const response = await this.get(`${this.getURL()}/${provider}/datacenters?detail=1`);
    return Array.isArray(response)
      ? response.map((datacenter) => this.datacenterReducer(provider, datacenter))
      : [];
  }

  async getDatacenter(id) {
    const [key, provider] = id.split('.');
    const response = await this.get(`${this.getURL()}/${provider}/datacenters/${key}`);
    return this.datacenterReducer(provider, response);
  }

  datacenterReducer(provider, datacenter) {
    return {
      id: `${datacenter.id}.${provider}`,
      kind: 'Datacenter',
      name: datacenter.name,
      clusters: datacenter.clusters,
      vms: datacenter.vms,
    };
  }

  async getClusters() {
    const providers = await this.getProviders();
    const result = Promise.all(
      providers.map((provider) => this.getClustersByProvider(provider.name))
    );
    return (await result).flat();
  }

  async getClustersByProvider(provider) {
    const response = await this.get(`${this.getURL()}/${provider}/clusters?detail=1`);
    return Array.isArray(response)
      ? response.map((cluster) => this.clusterReducer(provider, cluster))
      : [];
  }

  async getCluster(id, filter = {}) {
    const [key, provider] = id.split('.');
    const response = await this.get(`${this.getURL()}/${provider}/clusters/${key}`);
    const cluster = this.clusterReducer(provider, response);
    return isMatch(cluster, getFilters(filter)) ? cluster : null;
  }

  async getClustersByIds(ids, filter = {}) {
    return Promise.all(ids.map((id) => this.getCluster(id, filter)));
  }

  clusterReducer(provider, cluster) {
    return {
      id: `${cluster.id}.${provider}`,
      kind: 'Cluster',
      provider: provider,
      name: cluster.name,
      path: cluster.path,
      datastores: cluster.datastores,
      networks: cluster.networks,
      hosts: cluster.hosts,
      dasEnabled: cluster.dasEnabled,
      dasVms: cluster.dasEnabled,
      drsEnabled: cluster.drsEnabled,
      drsBehavior: cluster.drsBehavior,
      drsVms: cluster.drsVms,
    };
  }

  async getHosts() {
    const providers = await this.getProviders();
    const result = Promise.all(providers.map((provider) => this.getHostsByProvider(provider.name)));
    return (await result).flat();
  }

  async getHostsByProvider(provider) {
    const response = await this.get(`${this.getURL()}/${provider}/hosts?detail=1`);
    return Array.isArray(response) ? response.map((host) => this.hostReducer(provider, host)) : [];
  }

  async getHost(id) {
    const [key, provider] = id.split('.');
    const response = await this.get(`${this.getURL()}/${provider}/hosts/${key}`);
    return this.hostReducer(provider, response);
  }

  hostReducer(provider, host) {
    return {
      id: `${host.id}.${provider}`,
      name: host.name,
      provider: provider,
      inMaintenance: host.inMaintenance,
      cpuCores: host.cpuCores,
      cpuSockets: host.cpuSockets,
      productName: host.productName,
      parent: host.parent,
      path: host.path,
      productVersion: host.productVersion,
      // networking: host.networking,
      // networks: host.networks,
      // datastores: host.datastores,
      vms: host.vms,
      // networkAdapters: host.networkAdapters,
    };
  }

  async getVMs(filter = {}) {
    const providers = await this.getProviders();
    const result = Promise.all(
      providers.map((provider) => this.getVMsByProvider(provider.name, filter))
    );
    return (await result).flat();
  }

  async getVMsByProvider(provider, filter = {}) {
    const response = await this.get(`${this.getURL()}/${provider}/vms?detail=1`);
    const vms = Array.isArray(response) ? response.map((vm) => this.VMReducer(provider, vm)) : [];
    return vms.filter((vm) => isMatch(vm, getFilters(filter)));
  }

  async getVM(id, filter = {}) {
    const [key, provider] = id.split('.');
    const response = await this.get(`${this.getURL()}/${provider}/vms/${key}`);
    const vm = this.VMReducer(provider, response);
    return isMatch(vm, getFilters(filter)) ? vm : null;
  }

  async getVMsByIds(ids, filter = {}) {
    return Promise.all(ids.map((id) => this.getVM(id, filter)));
  }

  VMReducer(provider, vm) {
    return {
      id: `${vm.id}.${provider}`,
      kind: 'VM',
      parent: vm.parent,
      name: vm.name,
      path: vm.path,
      uuid: vm.uuid,
      firmware: vm.firmware,
      powerState: vm.powerState,
      cpuHotAddEnabled: vm.cpuHotAddEnabled,
      cpuHotRemoveEnabled: vm.cpuHotRemoveEnabled,
      memoryHotAddEnabled: vm.memoryHotAddEnabled,
      faultToleranceEnabled: vm.faultToleranceEnabled,
      cpuCount: vm.cpuCount,
      coresPerSocket: vm.coresPerSocket,
      memoryMB: vm.memoryMB,
      guestName: vm.guestName,
      balloonedMemory: vm.balloonedMemory,
      ipAddress: vm.ipAddress,
      storageUsed: vm.storageUsed,
      hostId: vm.host.id,
      concerns: vm.concerns,
      networks: vm.networks,
      disks: vm.disks,
      numaNodeAffinity: vm.numaNodeAffinity,
      devices: vm.devices,
      cpuAffinity: vm.cpuAffinity,
    };
  }

  async getDatastores() {
    const providers = await this.getProviders();
    const result = Promise.all(
      providers.map((provider) => this.getDatastoresByProvider(provider.name))
    );
    return (await result).flat();
  }

  async getDatastoresByProvider(provider) {
    const response = await this.get(`${this.getURL()}/${provider}/datastores?detail=1`);
    return Array.isArray(response)
      ? response.map((datastore) => this.datastoreReducer(provider, datastore))
      : [];
  }

  async getDatastore(id, filter = {}) {
    const [key, provider] = id.split('.');
    const response = await this.get(`${this.getURL()}/${provider}/datastores/${key}`);
    const datastore = this.datastoreReducer(provider, response);
    return isMatch(datastore, getFilters(filter)) ? datastore : null;
  }

  async getDatastoresByIds(provider, ids, filter = {}) {
    return Promise.all(ids.map((id) => this.getDatastore(id)));
  }

  datastoreReducer(provider, datastore) {
    return {
      id: `${datastore.id}.${provider}`,
      kind: 'Datastore',
      name: datastore.name,
      type: datastore.type,
      capacity: datastore.capacity,
      free: datastore.free,
      maintenance: datastore.maintenance,
    };
  }

  async getNetworks(filter = {}) {
    const providers = await this.getProviders();
    const result = Promise.all(
      providers.map((provider) => this.getNetworksByProvider(provider.name, filter))
    );
    return (await result).flat();
  }

  async getNetworksByProvider(provider, filter) {
    const response = await this.get(`${this.getURL()}/${provider}/networks?detail=1`);
    const networks = Array.isArray(response)
      ? response.map((network) => this.networkReducer(provider, network))
      : [];
    return networks.filter((network) => isMatch(network, getFilters(filter)));
  }

  async getNetwork(id, filter = {}) {
    const [key, provider] = id.split('.');
    const response = await this.get(`${this.getURL()}/${provider}/networks/${key}`);
    const network = this.networkReducer(provider, response);
    return isMatch(network, getFilters(filter)) ? network : null;
  }

  async getNetworksByIds(ids, filter = {}) {
    return Promise.all(ids.map((id) => this.getNetwork(id, filter)));
  }

  networkReducer(provider, network) {
    return {
      id: `${network.id}.${provider}`,
      kind: 'Network',
      name: network.name,
      path: network.path,
      type: network.type,
    };
  }
}

export default inventoryAPI;
