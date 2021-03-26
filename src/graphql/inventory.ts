import { RESTDataSource } from 'apollo-datasource-rest';
import { isMatch, getFilters } from './helpers.js';
import { Meta } from './discovery.js';

// TODO: use typegraphql.com approach to benefit from single source
// of truth for type definition from graphql.
export type Provider = {
  id: string;
  name: string;
  kind: string;
  product: string;
};

class inventoryAPI extends RESTDataSource {
  meta: Meta;

  constructor(meta) {
    super();
    this.meta = meta;
  }

  getVSpherePath(): string {
    if (this.meta?.namespace) {
      const resourceBase = `providers/vsphere`;
      return `${this.meta.url}/${resourceBase}`;
    }
    return '';
  }

  getOpenshiftPath(): string {
    if (this.meta?.namespace) {
      const resourceBase = `providers/openshift`;
      return `${this.meta.url}/${resourceBase}`;
    }
    return '';
  }

  async getOpenshiftProviders() {
    const response = await this.get(`${this.getOpenshiftPath()}?detail=1`);
    return Array.isArray(response)
      ? response.map((provider) => this.openshiftReducer(provider))
      : [];
  }

  async getOpenshiftProvider(providerId) {
    const response = await this.get(`${this.getOpenshiftPath()}/${providerId}`);
    return this.openshiftReducer(response);
  }

  openshiftReducer(provider) {
    return {
      id: provider.uid,
      name: provider.name,
      // namespace: provider.namespace,
      kind: 'Openshift',
    };
  }

  async getProviders() {
    const response = await this.get(`${this.getVSpherePath()}?detail=1`);

    return Array.isArray(response)
      ? response.map((provider) => this.providerReducer(provider))
      : [];
  }

  async getProvider(providerId) {
    const response = await this.get(`${this.getVSpherePath()}/${providerId}`);
    return this.providerReducer(response);
  }

  providerReducer(provider) {
    return {
      id: provider.uid,
      name: provider.name,
      kind: 'VSphere',
      product: provider.product,
    };
  }

  async getFolders() {
    const providers = await this.getProviders();
    const result = Promise.all(providers.map((provider) => this.getFoldersByProvider(provider.id)));
    return (await result).flat();
  }

  async getFoldersByProvider(providerId) {
    const response = await this.get(`${this.getVSpherePath()}/${providerId}/folders?detail=1`);
    return Array.isArray(response)
      ? response.map((folder) => this.folderReducer(providerId, folder))
      : [];
  }

  async getFolder(id) {
    const [key, providerId] = id.split('.');
    const response = await this.get(`${this.getVSpherePath()}/${providerId}/folders/${key}`);
    return this.folderReducer(providerId, response);
  }

  async getFoldersByIds(ids, filter = {}) {
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
      providers.map((provider) => this.getDatacentersByProvider(provider.id))
    );
    return (await result).flat();
  }

  async getDatacentersByProvider(providerId) {
    const response = await this.get(`${this.getVSpherePath()}/${providerId}/datacenters?detail=1`);
    return Array.isArray(response)
      ? response.map((datacenter) => this.datacenterReducer(providerId, datacenter))
      : [];
  }

  async getDatacenter(id) {
    const [key, providerId] = id.split('.');
    const response = await this.get(`${this.getVSpherePath()}/${providerId}/datacenters/${key}`);
    return this.datacenterReducer(providerId, response);
  }

  datacenterReducer(providerId, datacenter) {
    return {
      id: `${datacenter.id}.${providerId}`,
      kind: 'Datacenter',
      name: datacenter.name,
      clusters: datacenter.clusters,
      datastores: datacenter.datastores,
      networks: datacenter.networks,
      vms: datacenter.vms,
    };
  }

  async getClusters() {
    const providers = await this.getProviders();
    const result = Promise.all(
      providers.map((provider) => this.getClustersByProvider(provider.id))
    );
    return (await result).flat();
  }

  async getClustersByProvider(provider) {
    const response = await this.get(`${this.getVSpherePath()}/${provider}/clusters?detail=1`);
    return Array.isArray(response)
      ? response.map((cluster) => this.clusterReducer(provider, cluster))
      : [];
  }

  async getCluster(id, filter = {}) {
    const [key, provider] = id.split('.');
    const response = await this.get(`${this.getVSpherePath()}/${provider}/clusters/${key}`);
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

  async getHosts(filter = {}) {
    const providers = await this.getProviders();
    const result = Promise.all(
      providers.map((provider) => this.getHostsByProvider(provider.id, filter))
    );
    return (await result).flat();
  }

  async getHostsByProvider(provider, filter = {}) {
    const response = await this.get(`${this.getVSpherePath()}/${provider}/hosts?detail=1`);
    const hosts = Array.isArray(response)
      ? response.map((host) => this.hostReducer(provider, host))
      : [];
    return hosts.filter((vm) => isMatch(vm, getFilters(filter)));
  }

  async getHost(id, filter = {}) {
    const [key, provider] = id.split('.');
    const response = await this.get(`${this.getVSpherePath()}/${provider}/hosts/${key}`);
    const host = this.hostReducer(provider, response);
    return isMatch(host, getFilters(filter)) ? host : null;
  }

  async getHostsByIds(ids) {
    return Promise.all(ids.map((id) => this.getHost(id)));
  }

  hostReducer(provider, host) {
    return {
      id: `${host.id}.${provider}`,
      name: host.name,
      kind: 'Host',
      productName: host.productName,
      productVersion: host.productVersion,
      inMaintenance: host.inMaintenance,
      cpuCores: host.cpuCores,
      cpuSockets: host.cpuSockets,
      cluster: host.parent,
      path: host.path,
      datastores: host.datastores,
      networking: host.networking,
      networks: host.networks,
      networkAdapters: host.networkAdapters,
      vms: host.vms,
    };
  }

  async getDatastores() {
    const providers = await this.getProviders();
    const result = Promise.all(
      providers.map((provider) => this.getDatastoresByProvider(provider.id))
    );
    return (await result).flat();
  }

  async getDatastoresByProvider(provider) {
    const response = await this.get(`${this.getVSpherePath()}/${provider}/datastores?detail=1`);
    return Array.isArray(response)
      ? response.map((datastore) => this.datastoreReducer(provider, datastore))
      : [];
  }

  async getDatastore(id, filter = {}) {
    const [key, provider] = id.split('.');
    const response = await this.get(`${this.getVSpherePath()}/${provider}/datastores/${key}`);
    const datastore = this.datastoreReducer(provider, response);
    return isMatch(datastore, getFilters(filter)) ? datastore : null;
  }

  async getDatastoresByIds(ids, filter = {}) {
    return Promise.all(ids.map((id) => this.getDatastore(id)));
  }

  datastoreReducer(provider, datastore) {
    return {
      id: `${datastore.id}.${provider}`,
      kind: 'Datastore',
      name: datastore.name,
      type: datastore.type,
      parent: datastore.parent,
      capacity: datastore.capacity,
      free: datastore.free,
      maintenance: datastore.maintenance,
      hosts: datastore.hosts,
      vms: datastore.vms,
    };
  }

  async getNetworks(filter = {}) {
    const providers = await this.getProviders();
    const result = Promise.all(
      providers.map((provider) => this.getNetworksByProvider(provider.id, filter))
    );
    return (await result).flat();
  }

  async getNetworksByProvider(provider, filter) {
    const response = await this.get(`${this.getVSpherePath()}/${provider}/networks?detail=1`);
    const networks = Array.isArray(response)
      ? response.map((network) => this.networkReducer(provider, network))
      : [];
    return networks.filter((network) => isMatch(network, getFilters(filter)));
  }

  async getNetwork(id, filter = {}) {
    const [key, provider] = id.split('.');
    const response = await this.get(`${this.getVSpherePath()}/${provider}/networks/${key}`);
    const network = this.networkReducer(provider, response);
    return isMatch(network, getFilters(filter)) ? network : null;
  }

  async getNetworksByIds(ids, filter = {}) {
    return Promise.all(ids.map((id) => this.getNetwork(id, filter)));
  }

  networkReducer(provider, network) {
    let kind = '';
    if (network.variant === 'Standard') kind = 'Network';
    if (network.variant === 'DvPortGroup') kind = 'DVPortGroup';
    if (network.variant === 'DvSwitch') kind = 'DVSwitch';
    return {
      id: `${network.id}.${provider}`,
      kind: kind,
      name: network.name,
      path: network.path,
    };
  }

  async getVMs(filter = {}) {
    const providers = await this.getProviders();
    const result = Promise.all(
      providers.map((provider) => this.getVMsByProvider(provider.id, filter))
    );
    return (await result).flat();
  }

  async getVMsByProvider(provider, filter = {}) {
    const response = await this.get(`${this.getVSpherePath()}/${provider}/vms?detail=1`);
    const vms = Array.isArray(response) ? response.map((vm) => this.VMReducer(provider, vm)) : [];
    return vms.filter((vm) => isMatch(vm, getFilters(filter)));
  }

  async getVM(id, filter = {}) {
    const [key, providerId] = id.split('.');
    const response = await this.get(`${this.getVSpherePath()}/${providerId}/vms/${key}`);
    const vm = this.VMReducer(providerId, response);
    return isMatch(vm, getFilters(filter)) ? vm : null;
  }

  async getVMsByIds(ids, filter = {}) {
    return Promise.all(ids.map((id) => this.getVM(id, filter)));
  }

  VMReducer(provider, vm) {
    for (const disk of vm.disks) {
      disk.kind = 'Disk';
    }

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
      host: vm.host.id,
      concerns: vm.concerns,
      networks: vm.networks,
      disks: vm.disks,
      numaNodeAffinity: vm.numaNodeAffinity,
      devices: vm.devices,
      cpuAffinity: vm.cpuAffinity,
    };
  }

  async getNamespaces() {
    const providers = await this.getOpenshiftProviders();
    const result = Promise.all(
      providers.map((provider) => this.getNamespacesByProvider(provider.id))
    );
    return (await result).flat();
  }

  async getNamespacesByProvider(provider) {
    const response = await this.get(`${this.getOpenshiftPath()}/${provider}/namespaces?detail=1`);
    return Array.isArray(response)
      ? response.map((datastore) => this.namespaceReducer(provider, datastore))
      : [];
  }

  async getNamespacesByIds(ids, filter = {}) {
    return Promise.all(ids.map((id) => this.getNamespacesByProvider(id)));
  }

  namespaceReducer(provider, namespace) {
    return {
      id: `${namespace.name}.${provider}`,
      name: namespace.name,
      kind: 'Namespace',
    };
  }

  async getVMCs(filter = {}) {
    const providers = await this.getOpenshiftProviders();
    const result = Promise.all(
      providers.map((provider) => this.getVMCsByProvider(provider.id, filter))
    );
    return (await result).flat();
  }

  async getVMCsByProvider(providerId, filter = {}) {
    const response = await this.get(`${this.getOpenshiftPath()}/${providerId}/vms?detail=1`);

    const vmcs = Array.isArray(response)
      ? response.map((vmc) => this.VMCReducer(providerId, vmc))
      : [];

    return vmcs.filter((vmc) => isMatch(vmc, getFilters(filter)));
  }

  VMCReducer(provider, vmc) {
    return {
      id: `${vmc.uid}.${provider}`,
      kind: 'VMC',
      name: vmc.name,
      uid: vmc.uid,
      namespace: vmc.namespace,
    };
  }
}

export default inventoryAPI;
