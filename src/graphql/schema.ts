import { gql } from 'apollo-server-express';

const typeDefs = gql`
  type Link {
    kind: String
    id: String
  }

  union FolderGroup =
      Folder
    | Datacenter
    | Cluster
    | Datastore
    | Network
    | DVPortGroup
    | DVSwitch
    | VM
  union ClusterGroup = Folder | Cluster
  union VMGroup = Folder | VM
  union NetworkGroup = Network | DVPortGroup | DVSwitch

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
    networks: [NetworkGroup]
    datastores: [Datastore]
    vms: [VMGroup]
  }

  type Cluster {
    id: ID!
    kind: String
    name: String
    path: String
    datastores: [Datastore]
    networks: [NetworkGroup]
    hosts: [Host]
    dasEnabled: Boolean
    dasVms: [String]
    drsEnabled: Boolean
    drsBehavior: String
    drsVms: [String]
  }

  type Host {
    id: ID!
    name: String
    productName: String
    productVersion: String
    inMaintenance: Boolean
    cpuSockets: Int
    cpuCores: Int
    cluster: Link
    path: String
    datastores: [Datastore]
    networking: ConfigNetwork
    networks: [NetworkGroup]
    networkAdapters: [NetworkAdapter]
    vms(id: String, memoryMB: Int, powerState: String): [VM]
  }

  type Datastore {
    id: ID!
    kind: String
    name: String
    type: String
    capacity: String
    free: String
    maintenance: String
    hosts: [Host]
    vms: [VM]
  }

  type Network {
    id: ID!
    kind: String
    name: String
    parent: Folder
    path: String
    vms: [VM]
  }

  type DVPortGroup {
    id: ID!
    kind: String
    name: String
    parent: Folder
    path: String
    ports: [String]
    vms: [VM]
  }

  type DVSwitch {
    id: ID!
    kind: String
    name: String
    parent: Folder
    path: String
    portgroups: [DVPortGroup]
  }

  type ConfigNetwork {
    vNICs: [VNIC]
    pNICs: [PNIC]
    portGroups: [PortGroup]
    vSwitches: [VSwitch]
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
    named: String
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
    networks(id: String, type: String): [NetworkGroup]
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

  input HostFilter {
    id: String
    inMaintenance: Boolean
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
    hosts(filter: HostFilter): [Host]
    host(id: ID!): Host
    networks(filter: NetworkFilter): [NetworkGroup]
    network(id: ID!): NetworkGroup

    vms(filter: VMFilter): [VM]
    vm(id: ID!): VM
  }
`;

export default typeDefs;
