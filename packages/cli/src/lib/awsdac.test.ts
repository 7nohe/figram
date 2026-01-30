import { describe, expect, it } from "bun:test";
import { convertAwsdacToDsl } from "./awsdac";

describe("convertAwsdacToDsl", () => {
  describe("basic conversion", () => {
    it("converts a minimal awsdac document", () => {
      const input = {
        Diagram: {
          Resources: {
            MyVPC: {
              Type: "AWS::EC2::VPC",
            },
          },
        },
      };

      const result = convertAwsdacToDsl(input, { docId: "test" });

      expect(result).not.toBeNull();
      expect(result?.docId).toBe("test");
      expect(result?.nodes).toHaveLength(1);
      expect(result?.nodes[0].id).toBe("MyVPC");
      expect(result?.nodes[0].kind).toBe("network.vpc");
      expect(result?.nodes[0].provider).toBe("aws");
    });

    it("uses title option when provided", () => {
      const input = {
        Diagram: {
          Resources: {
            VPC: { Type: "AWS::EC2::VPC" },
          },
        },
      };

      const result = convertAwsdacToDsl(input, { docId: "doc", title: "My Title" });

      expect(result?.title).toBe("My Title");
    });

    it("defaults title to docId", () => {
      const input = {
        Diagram: {
          Resources: {
            VPC: { Type: "AWS::EC2::VPC" },
          },
        },
      };

      const result = convertAwsdacToDsl(input, { docId: "my-doc" });

      expect(result?.title).toBe("my-doc");
    });
  });

  describe("invalid input handling", () => {
    it("returns null for null input", () => {
      expect(convertAwsdacToDsl(null, { docId: "test" })).toBeNull();
    });

    it("returns null for empty object", () => {
      expect(convertAwsdacToDsl({}, { docId: "test" })).toBeNull();
    });

    it("returns null for missing Resources", () => {
      const input = { Diagram: {} };
      expect(convertAwsdacToDsl(input, { docId: "test" })).toBeNull();
    });

    it("returns null for empty Resources", () => {
      const input = { Diagram: { Resources: {} } };
      expect(convertAwsdacToDsl(input, { docId: "test" })).toBeNull();
    });

    it("returns null for array Resources", () => {
      const input = { Diagram: { Resources: [] } };
      expect(convertAwsdacToDsl(input, { docId: "test" })).toBeNull();
    });
  });

  describe("diagram root detection", () => {
    it("accepts Diagram key", () => {
      const input = {
        Diagram: {
          Resources: { VPC: { Type: "AWS::EC2::VPC" } },
        },
      };
      expect(convertAwsdacToDsl(input, { docId: "test" })).not.toBeNull();
    });

    it("accepts Diagrams key", () => {
      const input = {
        Diagrams: {
          Resources: { VPC: { Type: "AWS::EC2::VPC" } },
        },
      };
      expect(convertAwsdacToDsl(input, { docId: "test" })).not.toBeNull();
    });

    it("accepts Resources at root level", () => {
      const input = {
        Resources: { VPC: { Type: "AWS::EC2::VPC" } },
      };
      expect(convertAwsdacToDsl(input, { docId: "test" })).not.toBeNull();
    });
  });

  describe("type to kind mapping", () => {
    const testCases: Array<{ type: string; expectedKind: string }> = [
      { type: "AWS::EC2::VPC", expectedKind: "network.vpc" },
      { type: "AWS::EC2::Subnet", expectedKind: "network.subnet" },
      { type: "AWS::EC2::Instance", expectedKind: "compute.ec2" },
      { type: "AWS::EC2::InternetGateway", expectedKind: "network.vpc.internet_gateway" },
      { type: "AWS::EC2::NatGateway", expectedKind: "network.vpc.nat_gateway" },
      { type: "AWS::EC2::RouteTable", expectedKind: "network.vpc.route_table" },
      { type: "AWS::ElasticLoadBalancingV2::LoadBalancer", expectedKind: "compute.lb.alb" },
      { type: "AWS::RDS::DBInstance", expectedKind: "database.rds.instance" },
      { type: "AWS::S3::Bucket", expectedKind: "storage.s3.bucket" },
      { type: "AWS::Lambda::Function", expectedKind: "compute.lambda" },
      { type: "AWS::ECS::Cluster", expectedKind: "compute.container.ecs" },
      { type: "AWS::SNS::Topic", expectedKind: "integration.sns.topic" },
      { type: "AWS::SQS::Queue", expectedKind: "integration.sqs.queue" },
      { type: "AWS::APIGateway::RestApi", expectedKind: "network.api_gateway" },
      { type: "AWS::CloudFront::Distribution", expectedKind: "network.cloudfront" },
    ];

    for (const { type, expectedKind } of testCases) {
      it(`maps ${type} to ${expectedKind}`, () => {
        const input = {
          Diagram: {
            Resources: {
              Resource: { Type: type },
            },
          },
        };

        const result = convertAwsdacToDsl(input, { docId: "test" });
        expect(result?.nodes[0].kind).toBe(expectedKind);
      });
    }

    it("infers kind from unknown EC2 types", () => {
      const input = {
        Diagram: {
          Resources: {
            Resource: { Type: "AWS::EC2::SecurityGroup" },
          },
        },
      };

      const result = convertAwsdacToDsl(input, { docId: "test" });
      expect(result?.nodes[0].kind).toBe("compute.ec2");
    });

    it("infers kind from service name for unmapped types", () => {
      const input = {
        Diagram: {
          Resources: {
            Resource: { Type: "AWS::S3::AccessPoint" },
          },
        },
      };

      const result = convertAwsdacToDsl(input, { docId: "test" });
      expect(result?.nodes[0].kind).toBe("storage.s3");
    });

    it("defaults to generic.server for unknown types", () => {
      const input = {
        Diagram: {
          Resources: {
            Resource: { Type: "AWS::Unknown::Thing" },
          },
        },
      };

      const result = convertAwsdacToDsl(input, { docId: "test" });
      expect(result?.nodes[0].kind).toBe("generic.server");
    });

    it("defaults to generic.server for missing type", () => {
      const input = {
        Diagram: {
          Resources: {
            Resource: {},
          },
        },
      };

      const result = convertAwsdacToDsl(input, { docId: "test" });
      expect(result?.nodes[0].kind).toBe("generic.server");
    });
  });

  describe("diagram container types", () => {
    it("maps AWS::Diagram::Cloud to network.vpc", () => {
      const input = {
        Diagram: {
          Resources: {
            Cloud: { Type: "AWS::Diagram::Cloud" },
          },
        },
      };

      const result = convertAwsdacToDsl(input, { docId: "test" });
      expect(result?.nodes[0].kind).toBe("network.vpc");
    });

    it("maps AWS::Diagram::Group to network.subnet", () => {
      const input = {
        Diagram: {
          Resources: {
            Group: { Type: "AWS::Diagram::Group" },
          },
        },
      };

      const result = convertAwsdacToDsl(input, { docId: "test" });
      expect(result?.nodes[0].kind).toBe("network.subnet");
    });

    it("maps AWS::Diagram::Resource with children to network.subnet", () => {
      const input = {
        Diagram: {
          Resources: {
            Container: {
              Type: "AWS::Diagram::Resource",
              Children: ["Child"],
            },
            Child: { Type: "AWS::EC2::Instance" },
          },
        },
      };

      const result = convertAwsdacToDsl(input, { docId: "test" });
      const container = result?.nodes.find((n) => n.id === "Container");
      expect(container?.kind).toBe("network.subnet");
    });

    it("maps AWS::Diagram::Resource without children to generic.server", () => {
      const input = {
        Diagram: {
          Resources: {
            Resource: {
              Type: "AWS::Diagram::Resource",
            },
          },
        },
      };

      const result = convertAwsdacToDsl(input, { docId: "test" });
      expect(result?.nodes[0].kind).toBe("generic.server");
    });

    it("skips AWS::Diagram::Canvas type", () => {
      const input = {
        Diagram: {
          Resources: {
            Canvas: { Type: "AWS::Diagram::Canvas" },
            VPC: { Type: "AWS::EC2::VPC" },
          },
        },
      };

      const result = convertAwsdacToDsl(input, { docId: "test" });
      expect(result?.nodes).toHaveLength(1);
      expect(result?.nodes[0].id).toBe("VPC");
    });
  });

  describe("label extraction", () => {
    it("uses Title when provided", () => {
      const input = {
        Diagram: {
          Resources: {
            MyVPC: {
              Type: "AWS::EC2::VPC",
              Title: "Production VPC",
            },
          },
        },
      };

      const result = convertAwsdacToDsl(input, { docId: "test" });
      expect(result?.nodes[0].label).toBe("Production VPC");
    });

    it("trims whitespace from Title", () => {
      const input = {
        Diagram: {
          Resources: {
            MyVPC: {
              Type: "AWS::EC2::VPC",
              Title: "  Trimmed  ",
            },
          },
        },
      };

      const result = convertAwsdacToDsl(input, { docId: "test" });
      expect(result?.nodes[0].label).toBe("Trimmed");
    });

    it("falls back to resource ID when Title is missing", () => {
      const input = {
        Diagram: {
          Resources: {
            MyVPC: {
              Type: "AWS::EC2::VPC",
            },
          },
        },
      };

      const result = convertAwsdacToDsl(input, { docId: "test" });
      expect(result?.nodes[0].label).toBe("MyVPC");
    });

    it("falls back to resource ID when Title is empty", () => {
      const input = {
        Diagram: {
          Resources: {
            MyVPC: {
              Type: "AWS::EC2::VPC",
              Title: "   ",
            },
          },
        },
      };

      const result = convertAwsdacToDsl(input, { docId: "test" });
      expect(result?.nodes[0].label).toBe("MyVPC");
    });
  });

  describe("parent-child relationships", () => {
    it("sets parent from Children array", () => {
      const input = {
        Diagram: {
          Resources: {
            VPC: {
              Type: "AWS::EC2::VPC",
              Children: ["Subnet"],
            },
            Subnet: {
              Type: "AWS::EC2::Subnet",
            },
          },
        },
      };

      const result = convertAwsdacToDsl(input, { docId: "test" });
      const subnet = result?.nodes.find((n) => n.id === "Subnet");
      expect(subnet?.parent).toBe("VPC");
    });

    it("sets parent from BorderChildren array", () => {
      const input = {
        Diagram: {
          Resources: {
            VPC: {
              Type: "AWS::EC2::VPC",
              BorderChildren: ["IGW"],
            },
            IGW: {
              Type: "AWS::EC2::InternetGateway",
            },
          },
        },
      };

      const result = convertAwsdacToDsl(input, { docId: "test" });
      const igw = result?.nodes.find((n) => n.id === "IGW");
      expect(igw?.parent).toBe("VPC");
    });

    it("handles BorderChildren with object format", () => {
      const input = {
        Diagram: {
          Resources: {
            VPC: {
              Type: "AWS::EC2::VPC",
              BorderChildren: [{ Resource: "IGW" }],
            },
            IGW: {
              Type: "AWS::EC2::InternetGateway",
            },
          },
        },
      };

      const result = convertAwsdacToDsl(input, { docId: "test" });
      const igw = result?.nodes.find((n) => n.id === "IGW");
      expect(igw?.parent).toBe("VPC");
    });

    it("infers parent from Properties with Ref", () => {
      const input = {
        Diagram: {
          Resources: {
            VPC: { Type: "AWS::EC2::VPC" },
            Subnet: {
              Type: "AWS::EC2::Subnet",
              Properties: {
                VpcId: { Ref: "VPC" },
              },
            },
          },
        },
      };

      const result = convertAwsdacToDsl(input, { docId: "test" });
      const subnet = result?.nodes.find((n) => n.id === "Subnet");
      expect(subnet?.parent).toBe("VPC");
    });

    it("infers parent from Properties with Fn::GetAtt string", () => {
      const input = {
        Diagram: {
          Resources: {
            Subnet: { Type: "AWS::EC2::Subnet" },
            Instance: {
              Type: "AWS::EC2::Instance",
              Properties: {
                SubnetId: { "Fn::GetAtt": "Subnet.SubnetId" },
              },
            },
          },
        },
      };

      const result = convertAwsdacToDsl(input, { docId: "test" });
      const instance = result?.nodes.find((n) => n.id === "Instance");
      expect(instance?.parent).toBe("Subnet");
    });

    it("infers parent from Properties with Fn::GetAtt array", () => {
      const input = {
        Diagram: {
          Resources: {
            Subnet: { Type: "AWS::EC2::Subnet" },
            Instance: {
              Type: "AWS::EC2::Instance",
              Properties: {
                SubnetId: { "Fn::GetAtt": ["Subnet", "SubnetId"] },
              },
            },
          },
        },
      };

      const result = convertAwsdacToDsl(input, { docId: "test" });
      const instance = result?.nodes.find((n) => n.id === "Instance");
      expect(instance?.parent).toBe("Subnet");
    });

    it("prioritizes subnet over VPC as parent for instances", () => {
      const input = {
        Diagram: {
          Resources: {
            VPC: { Type: "AWS::EC2::VPC" },
            Subnet: { Type: "AWS::EC2::Subnet" },
            Instance: {
              Type: "AWS::EC2::Instance",
              Properties: {
                VpcId: { Ref: "VPC" },
                SubnetId: { Ref: "Subnet" },
              },
            },
          },
        },
      };

      const result = convertAwsdacToDsl(input, { docId: "test" });
      const instance = result?.nodes.find((n) => n.id === "Instance");
      expect(instance?.parent).toBe("Subnet");
    });
  });

  describe("links/edges conversion", () => {
    it("converts links to edges", () => {
      const input = {
        Diagram: {
          Resources: {
            Lambda: { Type: "AWS::Lambda::Function" },
            DynamoDB: { Type: "AWS::DynamoDB::Table" },
          },
          Links: [{ Source: "Lambda", Target: "DynamoDB" }],
        },
      };

      const result = convertAwsdacToDsl(input, { docId: "test" });
      expect(result?.edges).toHaveLength(1);
      expect(result?.edges?.[0].from).toBe("Lambda");
      expect(result?.edges?.[0].to).toBe("DynamoDB");
    });

    it("generates unique edge IDs", () => {
      const input = {
        Diagram: {
          Resources: {
            A: { Type: "AWS::Lambda::Function" },
            B: { Type: "AWS::DynamoDB::Table" },
          },
          Links: [
            { Source: "A", Target: "B" },
            { Source: "A", Target: "B" },
          ],
        },
      };

      const result = convertAwsdacToDsl(input, { docId: "test" });
      expect(result?.edges).toHaveLength(2);
      expect(result?.edges?.[0].id).toBe("link_A_to_B");
      expect(result?.edges?.[1].id).toBe("link_A_to_B_1");
    });

    it("extracts label from link Labels", () => {
      const input = {
        Diagram: {
          Resources: {
            A: { Type: "AWS::Lambda::Function" },
            B: { Type: "AWS::DynamoDB::Table" },
          },
          Links: [
            {
              Source: "A",
              Target: "B",
              Labels: {
                AutoRight: { Title: "reads from" },
              },
            },
          ],
        },
      };

      const result = convertAwsdacToDsl(input, { docId: "test" });
      expect(result?.edges?.[0].label).toBe("reads from");
    });

    it("tries multiple label keys", () => {
      const input = {
        Diagram: {
          Resources: {
            A: { Type: "AWS::Lambda::Function" },
            B: { Type: "AWS::DynamoDB::Table" },
          },
          Links: [
            {
              Source: "A",
              Target: "B",
              Labels: {
                TargetLeft: { Title: "writes to" },
              },
            },
          ],
        },
      };

      const result = convertAwsdacToDsl(input, { docId: "test" });
      expect(result?.edges?.[0].label).toBe("writes to");
    });

    it("skips links with missing source or target nodes", () => {
      const input = {
        Diagram: {
          Resources: {
            A: { Type: "AWS::Lambda::Function" },
          },
          Links: [{ Source: "A", Target: "NonExistent" }],
        },
      };

      const result = convertAwsdacToDsl(input, { docId: "test" });
      expect(result?.edges).toBeUndefined();
    });

    it("skips links with missing source or target fields", () => {
      const input = {
        Diagram: {
          Resources: {
            A: { Type: "AWS::Lambda::Function" },
            B: { Type: "AWS::DynamoDB::Table" },
          },
          Links: [{ Source: "A" }],
        },
      };

      const result = convertAwsdacToDsl(input, { docId: "test" });
      expect(result?.edges).toBeUndefined();
    });

    it("omits edges when no valid links", () => {
      const input = {
        Diagram: {
          Resources: {
            A: { Type: "AWS::Lambda::Function" },
          },
          Links: [],
        },
      };

      const result = convertAwsdacToDsl(input, { docId: "test" });
      expect(result?.edges).toBeUndefined();
    });
  });

  describe("layout assignment", () => {
    it("assigns layout to top-level nodes", () => {
      const input = {
        Diagram: {
          Resources: {
            VPC1: { Type: "AWS::EC2::VPC" },
            VPC2: { Type: "AWS::EC2::VPC" },
          },
        },
      };

      const result = convertAwsdacToDsl(input, { docId: "test" });
      const vpc1 = result?.nodes.find((n) => n.id === "VPC1");
      const vpc2 = result?.nodes.find((n) => n.id === "VPC2");

      expect(vpc1?.layout?.x).toBeDefined();
      expect(vpc1?.layout?.y).toBeDefined();
      expect(vpc2?.layout?.x).toBeDefined();
      expect(vpc2?.layout?.y).toBeDefined();
    });

    it("computes VPC size based on subnet count", () => {
      const input = {
        Diagram: {
          Resources: {
            VPC: {
              Type: "AWS::EC2::VPC",
              Children: ["Subnet1", "Subnet2", "Subnet3", "Subnet4"],
            },
            Subnet1: { Type: "AWS::EC2::Subnet" },
            Subnet2: { Type: "AWS::EC2::Subnet" },
            Subnet3: { Type: "AWS::EC2::Subnet" },
            Subnet4: { Type: "AWS::EC2::Subnet" },
          },
        },
      };

      const result = convertAwsdacToDsl(input, { docId: "test" });
      const vpc = result?.nodes.find((n) => n.id === "VPC");

      expect(vpc?.layout?.w).toBeGreaterThan(800);
      expect(vpc?.layout?.h).toBeGreaterThan(600);
    });
  });
});
