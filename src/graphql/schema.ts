import { gql } from 'apollo-server-express';

const typeDefs = gql`
  type Link {
    kind: String
    id: String
  }

  union FolderGroup = Folder | VM | Datacenter | Cluster | Datastore | Network
  union ClusterGroup = Folder | Cluster
  union VMGroup = Folder | VM

  type Folder {
    id: ID!
    kind: String
    name: String
    parent: Link
    children: [FolderGroup]
  }

  type Provider {
    id: ID!
    name: String
    kind: String
    product: String
    datacenters: [Datacenter]
  }

  type Datacenter {
    id: ID!
    kind: String
    name: String
    parent: Link
    clusters: [Cluster]
    networks: [Network]
    datastores: [Datastore]
    vms: [VM]
  }

  type Cluster {
    id: ID!
    kind: String
    name: String
    path: String
    datastores: [Datastore]
    networks: [Network]
    hosts: [Host]
    dasEnabled: Boolean
    dasVms: [String]
    drsEnabled: Boolean
    drsBehavior: String
    drsVms: [String]
  }

  type Datastore {
    id: ID!
    kind: String
    name: String
    type: String
    capacity: String
    free: String
    maintenance: String
    vms: [VM]
  }

  type Host {
    id: ID!
    name: String
    productName: String
    inMaintenance: Boolean
    cpuSockets: Int
    cpuCores: Int
    parent: Link
    path: String
    productVersion: String
    configNetwork: ConfigNetwork
    networks: [Network]
    datastores: [Datastore]
    vms(id: String, memoryMB: Int, powerState: String): [VM]
    networkAdapters: [NetworkAdapter]
  }

  type Network {
    id: ID!
    kind: String
    name: String
    parent: Folder
    path: String
    type: String
  }

  type ConfigNetwork {
    vNICs: [VNIC]
    pNICs: [PNIC]
    portGroups: [PortGroup]
    vSwitches: [VSwitch]
  }

  type VNIC {
    key: String
    linkSpeed: Int
  }

  type PNIC {
    key: String
    portGroup: String
    dPortGroup: String
    ipAddress: String
    mtu: Int
  }

  type PortGroup {
    key: String
    name: String
    vswitch: VSwitch
  }

  type VSwitch {
    key: String
    name: String
    portGroups: [PortGroup]
    pNICs: [PNIC]
  }

  type NetworkAdapter {
    name: String
    ipAddress: String
    linkSpeed: Int
    mtu: Int
  }

  type VM {
    id: ID!
    kind: String
    name: String
    path: String
    revision: Int
    selfLink: String
    uuid: String
    firmware: String
    powerState: String
    cpuHotAddEnabled: Boolean
    cpuHotRemoveEnabled: Boolean
    memoryHotAddEnabled: Boolean
    faultToleranceEnabled: Boolean
    cpuCount: Int
    coresPerSocket: Int
    memoryMB: Int
    guestName: String
    balloonedMemory: Int
    ipAddress: String
    storageUsed: Int
    numaNodeAffinity: [String]
    devices: [Device]
    cpuAffinity: [Int]
    host(id: String): Host
    networks(id: String, type: String): [Network]
    revisionAnalyzed: Int
    disks: [Disk]
    concerns(label: String, category: String): [Concern]
  }

  type Device {
    Kind: String
  }

  type Disk {
    file: String
    datastore: Link
    capacity: Int
    shared: Boolean
    rdm: Boolean
  }

  type Concern {
    label: String
    category: String
    assessment: String
  }

  input VMFilter {
    id: String
    cpuHotAddEnabled: Boolean
    ipAddress: String
    powerState: String
    memoryMB: Int
  }

  input NetworkFilter {
    id: String
    type: String
  }

  type Query {
    folders: [Folder]
    folder(id: ID!): Folder
    providers: [Provider]
    provider(name: String): Provider
    datacenters: [Datacenter]
    datacenter(id: ID!): Datacenter

    clusters: [Cluster]
    cluster(id: ID!): Cluster
    datastores: [Datastore]
    datastore(id: ID!): Datastore
    hosts: [Host]
    host(id: ID!): Host
    networks(filter: NetworkFilter): [Network]
    network(id: ID!): Network

    vms(filter: VMFilter): [VM]
    vm(id: ID!): VM
  }
`;

export default typeDefs;
