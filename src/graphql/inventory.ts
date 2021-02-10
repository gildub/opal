import { RESTDataSource } from 'apollo-datasource-rest';
import { isMatch, getFilters } from './helpers.js';

class inventoryAPI extends RESTDataSource {
  URLs: string[];
  namespace: string;
  count: number;

  constructor(URLs, namespace) {
    super();
    this.URLs = URLs;
    this.namespace = namespace;
    this.count = 0;
  }

  getURL(vsphere) {
    const namespaceURL = `/namespaces/${this.namespace}/providers/vsphere`;
    // console.log('path', this.URLs[vsphere] + namespaceURL);
    return this.URLs[vsphere] + namespaceURL;
  }

  async getVSphere(id) {
    console.log(`${this.URLs[id]}/namespaces`);
    const response = await this.get(`${this.URLs[id]}/namespaces`);
    return this.vsphereReducer(response);
  }

  async getVSpheres() {
    return Promise.all(this.URLs.map((e, i) => this.getVSphere(i)));
  }

  vsphereReducer(vsphere) {
    const id = this.count++;
    return {
      id: id,
      url: this.URLs[id],
      kind: 'VSphere',
      namespaces: vsphere.map((namespace) => namespace.name),
    };
  }

  async getProviders(vsphere) {
    const response = await this.get(`${this.getURL(vsphere)}?detail=1`);
    return Array.isArray(response)
      ? response.map((provider) => this.providerReducer(vsphere, provider))
      : [];
  }

  async getProvider(vsphere, name) {
    const response = await this.get(`${this.getURL(vsphere)}/${name}`);
    return this.providerReducer(vsphere, response);
  }

  providerReducer(vsphere, provider) {
    return {
      id: provider.uid,
      name: provider.name,
      kind: 'Provider',
      product: provider.product,
      vsphere: vsphere,
    };
  }

  async getDatacenters(provider) {
    const response = await this.get(`${this.baseURL}/${provider}/datacenters?detail=1`);
    return Array.isArray(response)
      ? response.map((datacenter) => this.datacenterReducer(provider, datacenter))
      : [];
  }

  async getDatacenter(provider, id) {
    const response = await this.get(`${this.baseURL}/${provider}/datacenters/${id}`);
    return this.datacenterReducer(provider, response);
  }

  datacenterReducer(provider, datacenter) {
    return {
      id: datacenter.id,
      kind: 'Datacenter',
      provider: provider,
      name: datacenter.name,
      clusters: datacenter.clusters,
      vms: datacenter.vms,
    };
  }

  async getClusters(provider) {
    const response = await this.get(`${this.baseURL}/${provider}/clusters?detail=1`);
    return Array.isArray(response)
      ? response.map((cluster) => this.clusterReducer(provider, cluster))
      : [];
  }

  async getCluster(provider, id, filter = {}) {
    const response = await this.get(`${this.baseURL}/${provider}/clusters/${id}`);
    const cluster = this.clusterReducer(provider, response);
    return isMatch(cluster, getFilters(filter)) ? cluster : null;
  }

  async getClustersByIds(ids, filter = {}) {
    return Promise.all(ids.map((id) => this.getCluster(id, filter)));
  }

  clusterReducer(provider, cluster) {
    return {
      id: cluster.id,
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

  async getHosts(provider) {
    const response = await this.get(`${this.baseURL}/${provider}/hosts?detail=1`);
    return Array.isArray(response) ? response.map((host) => this.hostReducer(provider, host)) : [];
  }

  async getHost(provider, id) {
    const response = await this.get(`${this.baseURL}/${provider}/hosts/${id}`);
    return this.hostReducer(provider, response);
  }

  hostReducer(provider, host) {
    return {
      id: host.id,
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

  async getVMs(provider, filter = {}) {
    const response = await this.get(`${this.baseURL}/${provider}/vms?detail=1`);
    const vms = Array.isArray(response) ? response.map((vm) => this.VMReducer(provider, vm)) : [];
    return vms.filter((vm) => isMatch(vm, getFilters(filter)));
  }

  async getVM(provider, id, filter = {}) {
    const response = await this.get(`${this.baseURL}/${provider}/vms/${id}`);
    const vm = this.VMReducer(provider, response);
    return isMatch(vm, getFilters(filter)) ? vm : null;
  }

  async getVMsByIds(provider, ids, filter = {}) {
    return Promise.all(ids.map((id) => this.getVM(provider, id, filter)));
  }

  VMReducer(provider, vm) {
    return {
      id: vm.id,
      kind: 'VM',
      provider: provider,
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

  async getDatastores(provider) {
    const response = await this.get(`${this.baseURL}/${provider}/datastores?detail=1`);
    return Array.isArray(response)
      ? response.map((datastore) => this.datastoreReducer(datastore))
      : [];
  }

  async getDatastore(provider, id, filter = {}) {
    const response = await this.get(`${this.baseURL}/${provider}/datastores/${id}`);
    const datastore = this.datastoreReducer(response);
    return isMatch(datastore, getFilters(filter)) ? datastore : null;
  }

  async getDatastoresByIds(provider, ids, filter = {}) {
    return Promise.all(ids.map((id) => this.getDatastore(provider, id, filter)));
  }

  datastoreReducer(datastore) {
    return {
      id: datastore.id,
      kind: 'Datastore',
      name: datastore.name,
    };
  }

  async getFolders(provider) {
    const response = await this.get(`${this.baseURL}/${provider}/folders?detail=1`);
    return Array.isArray(response)
      ? response.map((folder) => this.folderReducer(provider, folder))
      : [];
  }

  async getFolder(provider, id) {
    const response = await this.get(`${this.baseURL}/${provider}/folders/${id}`);
    return this.folderReducer(provider, response);
  }

  async getFoldersByIds(provider, ids, filter = {}) {
    return Promise.all(ids.map((id) => this.getFolder(provider, id)));
  }

  folderReducer(provider, folder) {
    return {
      id: folder.id,
      kind: 'Folder',
      provider: provider,
      name: folder.name,
      parent: folder.parent,
      children: folder.children,
    };
  }

  async getNetworks(provider) {
    const response = await this.get(`${this.baseURL}/${provider}/networks?detail=1`);
    return Array.isArray(response) ? response.map((network) => this.networkReducer(network)) : [];
  }

  async getNetwork(provider, id, filter = {}) {
    const response = await this.get(`${this.baseURL}/${provider}/networks/${id}`);
    const network = this.networkReducer(response);
    return isMatch(network, getFilters(filter)) ? network : null;
  }

  async getNetworksByIds(provider, ids, filter = {}) {
    return Promise.all(ids.map((id) => this.getNetwork(provider, id, filter)));
  }

  networkReducer(network) {
    return {
      id: network.id,
      kind: 'Network',
      name: network.name,
      path: network.path,
      type: network.type,
    };
  }
}

export default inventoryAPI;
