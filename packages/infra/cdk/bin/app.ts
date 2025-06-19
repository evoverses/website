#!/usr/bin/env node

import "source-map-support/register";
import { App } from "aws-cdk-lib";
import { InfraStage } from "../lib/stage";

const app = new App();
// new InfraStage(app, "Dev", { env: { region: "us-east-2" } });
new InfraStage(app, "Prod", { env: { region: "us-east-2" } });
