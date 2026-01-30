import type { DSLDocument, DSLEdge, DSLNode } from "@figram/core";

type AwsdacResource = {
  Type?: string;
  Title?: string;
  Children?: unknown;
  BorderChildren?: unknown;
  Preset?: string;
  Properties?: unknown;
};

type AwsdacLink = {
  Source?: unknown;
  Target?: unknown;
  Labels?: unknown;
};

type AwsdacDiagram = {
  Resources?: unknown;
  Links?: unknown;
};

const DEFAULT_PROVIDER = "aws";
const DEFAULT_KIND = "generic.server";

const SKIP_TYPES = new Set(["AWS::Diagram::Canvas"]);
const VPC_TYPES = new Set(["AWS::EC2::VPC"]);
const SUBNET_TYPES = new Set(["AWS::EC2::Subnet"]);
const INSTANCE_TYPES = new Set(["AWS::EC2::Instance"]);

// Keep in sync with core auto-layout defaults (packages/core/src/normalize.ts)
const SUBNET_LAYOUT = {
  PADDING: 40,
  GAP: 40,
  DEFAULT_WIDTH: 450,
  DEFAULT_HEIGHT: 400,
  COLS: 3,
} as const;

const VPC_DEFAULT_SIZE = {
  W: 800,
  H: 600,
} as const;

const TYPE_KIND_MAP: Record<string, string> = {
  "AWS::EC2::VPC": "network.vpc",
  "AWS::EC2::Subnet": "network.subnet",
  "AWS::EC2::Instance": "compute.ec2",
  "AWS::EC2::InternetGateway": "network.vpc.internet_gateway",
  "AWS::EC2::NatGateway": "network.vpc.nat_gateway",
  "AWS::EC2::RouteTable": "network.vpc.route_table",
  "AWS::ElasticLoadBalancingV2::LoadBalancer": "compute.lb.alb",
  "AWS::ElasticLoadBalancing::LoadBalancer": "compute.lb.clb",
  "AWS::RDS::DBInstance": "database.rds.instance",
  "AWS::RDS::DBCluster": "database.rds",
  "AWS::S3::Bucket": "storage.s3.bucket",
  "AWS::DynamoDB::Table": "database.dynamodb.table",
  "AWS::Lambda::Function": "compute.lambda",
  "AWS::ECS::Cluster": "compute.container.ecs",
  "AWS::ECS::Service": "compute.container.ecs_service",
  "AWS::ECS::TaskDefinition": "compute.container.ecs_task",
  "AWS::EKS::Cluster": "compute.container.eks",
  "AWS::SNS::Topic": "integration.sns.topic",
  "AWS::SQS::Queue": "integration.sqs.queue",
  "AWS::APIGateway::RestApi": "network.api_gateway",
  "AWS::APIGatewayV2::Api": "network.api_gateway",
  "AWS::CloudFront::Distribution": "network.cloudfront",
  "AWS::Route53::HostedZone": "network.route53.hosted_zone",
  "AWS::ElastiCache::CacheCluster": "database.elasticache",
  "AWS::ElastiCache::ReplicationGroup": "database.elasticache",
  "AWS::Redshift::Cluster": "database.redshift",
  "AWS::Kinesis::Stream": "analytics.kinesis",
};

const DIAGRAM_CONTAINER_TYPES = new Set([
  "AWS::Diagram::Cloud",
  "AWS::Diagram::Group",
  "AWS::Diagram::VerticalStack",
  "AWS::Diagram::HorizontalStack",
]);

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function normalizeChildren(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === "string") as string[];
}

function normalizeBorderChildren(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const result: string[] = [];
  for (const item of value) {
    if (typeof item === "string") {
      result.push(item);
      continue;
    }
    if (item && typeof item === "object") {
      const obj = item as Record<string, unknown>;
      const candidate =
        asString(obj.Resource) ?? asString(obj.ResourceId) ?? asString(obj.ResourceName) ?? asString(obj.Name);
      if (candidate) result.push(candidate);
    }
  }
  return result;
}

function mapTypeToKind(type: string | undefined, resource: AwsdacResource): string {
  if (!type) return DEFAULT_KIND;

  if (TYPE_KIND_MAP[type]) {
    return TYPE_KIND_MAP[type];
  }

  if (type.startsWith("AWS::Diagram::")) {
    if (type === "AWS::Diagram::Cloud") {
      return "network.vpc";
    }
    if (DIAGRAM_CONTAINER_TYPES.has(type)) {
      return "network.subnet";
    }
    if (type === "AWS::Diagram::Resource") {
      const hasChildren = normalizeChildren(resource.Children).length > 0;
      return hasChildren ? "network.subnet" : DEFAULT_KIND;
    }
  }

  const parts = type.split("::");
  if (parts.length === 3 && parts[0] === "AWS") {
    const service = parts[1];
    const resourceName = parts[2];

    if (service === "EC2") {
      if (resourceName.includes("VPC")) return "network.vpc";
      if (resourceName.includes("Subnet")) return "network.subnet";
      if (resourceName.includes("InternetGateway")) return "network.vpc.internet_gateway";
      if (resourceName.includes("NatGateway")) return "network.vpc.nat_gateway";
      if (resourceName.includes("RouteTable")) return "network.vpc.route_table";
      return "compute.ec2";
    }

    if (service === "S3") return "storage.s3";
    if (service === "RDS") return "database.rds";
    if (service === "DynamoDB") return "database.dynamodb";
    if (service === "Lambda") return "compute.lambda";
    if (service === "ECS") return "compute.container.ecs";
    if (service === "EKS") return "compute.container.eks";
    if (service === "SNS") return "integration.sns";
    if (service === "SQS") return "integration.sqs";
    if (service === "CloudFront") return "network.cloudfront";
    if (service === "Route53") return "network.route53";
    if (service === "APIGateway" || service === "APIGatewayV2") return "network.api_gateway";
    if (service === "ElasticLoadBalancingV2") return "compute.lb.alb";
    if (service === "ElasticLoadBalancing") return "compute.lb.clb";
  }

  return DEFAULT_KIND;
}

function extractLabel(resourceId: string, resource: AwsdacResource): string {
  const title = asString(resource.Title);
  if (title && title.trim()) return title.trim();
  return resourceId;
}

function extractRefCandidate(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  const ref = asString(obj.Ref);
  if (ref) return ref;
  const getAtt = obj["Fn::GetAtt"];
  if (typeof getAtt === "string") {
    const [resourceId] = getAtt.split(".");
    return resourceId || null;
  }
  if (Array.isArray(getAtt) && typeof getAtt[0] === "string") {
    return getAtt[0];
  }
  return null;
}

function collectResourceRefs(
  value: unknown,
  resourceIds: Set<string>,
  refs: Set<string>,
): void {
  if (typeof value === "string") {
    if (resourceIds.has(value)) refs.add(value);
    return;
  }

  const ref = extractRefCandidate(value);
  if (ref && resourceIds.has(ref)) refs.add(ref);

  if (Array.isArray(value)) {
    for (const item of value) {
      collectResourceRefs(item, resourceIds, refs);
    }
    return;
  }

  if (value && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) {
      collectResourceRefs(child, resourceIds, refs);
    }
  }
}

function isVpcResource(resource: AwsdacResource | undefined): boolean {
  return !!resource?.Type && VPC_TYPES.has(resource.Type);
}

function isSubnetResource(resource: AwsdacResource | undefined): boolean {
  return !!resource?.Type && SUBNET_TYPES.has(resource.Type);
}

function inferParentFromProperties(
  resourceId: string,
  resource: AwsdacResource,
  resources: Record<string, AwsdacResource>,
  resourceIds: Set<string>,
): string | null {
  const refs = new Set<string>();
  collectResourceRefs(resource.Properties, resourceIds, refs);
  if (refs.size === 0) return null;

  const vpcRefs: string[] = [];
  const subnetRefs: string[] = [];
  for (const ref of refs) {
    const target = resources[ref];
    if (isSubnetResource(target)) subnetRefs.push(ref);
    if (isVpcResource(target)) vpcRefs.push(ref);
  }

  if (resource.Type && VPC_TYPES.has(resource.Type)) return null;

  if (resource.Type && SUBNET_TYPES.has(resource.Type)) {
    return vpcRefs[0] ?? null;
  }

  if (resource.Type && INSTANCE_TYPES.has(resource.Type)) {
    return subnetRefs[0] ?? vpcRefs[0] ?? null;
  }

  return subnetRefs[0] ?? vpcRefs[0] ?? null;
}

function computeVpcSize(subnetCount: number): { w: number; h: number } | null {
  if (subnetCount <= 0) return null;
  const cols = Math.min(subnetCount, SUBNET_LAYOUT.COLS);
  const rows = Math.ceil(subnetCount / cols);
  const w =
    SUBNET_LAYOUT.PADDING * 2 +
    cols * SUBNET_LAYOUT.DEFAULT_WIDTH +
    (cols - 1) * SUBNET_LAYOUT.GAP;
  const h =
    SUBNET_LAYOUT.PADDING * 2 +
    rows * SUBNET_LAYOUT.DEFAULT_HEIGHT +
    (rows - 1) * SUBNET_LAYOUT.GAP;

  return {
    w: Math.max(VPC_DEFAULT_SIZE.W, w),
    h: Math.max(VPC_DEFAULT_SIZE.H, h),
  };
}

function extractLinkLabel(link: AwsdacLink): string | undefined {
  const labels = link.Labels;
  if (!labels || typeof labels !== "object") return undefined;
  const obj = labels as Record<string, unknown>;
  const keys = [
    "AutoRight",
    "AutoLeft",
    "SourceLeft",
    "SourceRight",
    "TargetLeft",
    "TargetRight",
  ];
  for (const key of keys) {
    const entry = obj[key];
    if (entry && typeof entry === "object") {
      const title = asString((entry as Record<string, unknown>).Title);
      if (title && title.trim()) return title.trim();
    }
  }
  return undefined;
}

function getDiagramRoot(parsed: unknown): AwsdacDiagram | null {
  if (!parsed || typeof parsed !== "object") return null;
  const root = parsed as Record<string, unknown>;
  const diagram = (root.Diagram ?? root.Diagrams ?? root) as unknown;
  if (!diagram || typeof diagram !== "object") return null;
  return diagram as AwsdacDiagram;
}

export function convertAwsdacToDsl(
  parsed: unknown,
  options: { docId: string; title?: string },
): DSLDocument | null {
  const diagram = getDiagramRoot(parsed);
  if (!diagram) return null;

  const resourcesRaw = diagram.Resources;
  if (!resourcesRaw || typeof resourcesRaw !== "object" || Array.isArray(resourcesRaw)) return null;
  const resources = resourcesRaw as Record<string, AwsdacResource>;

  const childToParent = new Map<string, string>();

  for (const [id, resource] of Object.entries(resources)) {
    for (const child of normalizeChildren(resource.Children)) {
      if (resources[child] && !childToParent.has(child)) {
        childToParent.set(child, id);
      }
    }
    for (const child of normalizeBorderChildren(resource.BorderChildren)) {
      if (resources[child] && !childToParent.has(child)) {
        childToParent.set(child, id);
      }
    }
  }

  const resourceIds = new Set(Object.keys(resources));
  for (const [id, resource] of Object.entries(resources)) {
    if (childToParent.has(id)) continue;
    if (resource.Type && SKIP_TYPES.has(resource.Type)) continue;
    const inferred = inferParentFromProperties(id, resource, resources, resourceIds);
    if (inferred && inferred !== id) {
      childToParent.set(id, inferred);
    }
  }

  const childrenByParent = new Map<string, string[]>();
  for (const [child, parent] of childToParent.entries()) {
    const list = childrenByParent.get(parent) ?? [];
    list.push(child);
    childrenByParent.set(parent, list);
  }

  const containerSizes = new Map<string, { w: number; h: number }>();
  for (const [parentId, children] of childrenByParent.entries()) {
    const parentResource = resources[parentId];
    if (!parentResource?.Type) continue;
    if (VPC_TYPES.has(parentResource.Type)) {
      const subnetCount = children.filter((id) => isSubnetResource(resources[id])).length;
      const size = computeVpcSize(subnetCount);
      if (size) containerSizes.set(parentId, size);
    }
  }

  const resolveParent = (id: string): string | null => {
    let parent = childToParent.get(id);
    while (parent) {
      const parentType = asString(resources[parent]?.Type);
      if (!parentType || !SKIP_TYPES.has(parentType)) break;
      parent = childToParent.get(parent);
    }
    return parent ?? null;
  };

  const nodes: DSLNode[] = [];
  const nodeIds = new Set<string>();

  for (const [id, resource] of Object.entries(resources)) {
    const type = asString(resource.Type);
    if (type && SKIP_TYPES.has(type)) continue;

    const kind = mapTypeToKind(type, resource);
    const label = extractLabel(id, resource);
    const parent = resolveParent(id);

    const node: DSLNode = {
      id,
      provider: DEFAULT_PROVIDER,
      kind,
      label,
    };

    if (parent) {
      node.parent = parent;
    }

    const size = containerSizes.get(id);
    if (size) {
      node.layout = { w: size.w, h: size.h };
    }

    nodes.push(node);
    nodeIds.add(id);
  }

  if (nodes.length === 0) return null;

  // Assign layout for top-level nodes (required by Figram DSL)
  const topLevel = nodes.filter((node) => !node.parent);
  const COLS = 2;
  const STEP_X = 900;
  const STEP_Y = 700;
  const PADDING_X = 40;
  const PADDING_Y = 40;
  for (let i = 0; i < topLevel.length; i++) {
    const node = topLevel[i];
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    node.layout = {
      ...(node.layout ?? {}),
      x: PADDING_X + col * STEP_X,
      y: PADDING_Y + row * STEP_Y,
    };
  }

  const edges: DSLEdge[] = [];
  const linksRaw = diagram.Links;
  const links = Array.isArray(linksRaw) ? (linksRaw as AwsdacLink[]) : [];
  const edgeIds = new Set<string>();

  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    const source = asString(link.Source);
    const target = asString(link.Target);
    if (!source || !target) continue;
    if (!nodeIds.has(source) || !nodeIds.has(target)) continue;

    const baseId = `link_${source}_to_${target}`;
    let id = baseId;
    let suffix = 1;
    while (edgeIds.has(id)) {
      id = `${baseId}_${suffix}`;
      suffix += 1;
    }
    edgeIds.add(id);

    const label = extractLinkLabel(link);
    edges.push({
      id,
      from: source,
      to: target,
      ...(label ? { label } : {}),
    });
  }

  return {
    version: 1,
    docId: options.docId,
    title: options.title ?? options.docId,
    nodes,
    edges: edges.length > 0 ? edges : undefined,
  };
}
