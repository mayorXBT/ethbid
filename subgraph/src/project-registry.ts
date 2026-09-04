import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  ProjectOwnerTransferred,
  ProjectRegistered,
  ProjectUpdated,
  ProjectVerified,
} from "../generated/ProjectRegistry/ProjectRegistry";
import { Project } from "../generated/schema";
import { verificationLabel } from "./ids";

function loadOrCreate(id: Bytes): Project {
  let project = Project.load(id);
  if (project == null) {
    project = new Project(id);
    project.owner = Bytes.empty();
    project.verification = "None";
    project.identityRef = Bytes.empty();
    project.metadataURI = "";
    project.createdAt = BigInt.zero();
    project.updatedAt = BigInt.zero();
  }
  return project;
}

export function handleProjectRegistered(event: ProjectRegistered): void {
  let project = loadOrCreate(event.params.id);
  project.owner = event.params.owner;
  project.verification = verificationLabel(event.params.verification);
  project.identityRef = event.params.identityRef;
  project.metadataURI = event.params.metadataURI;
  project.createdAt = event.block.timestamp;
  project.updatedAt = event.block.timestamp;
  project.save();
}

export function handleProjectUpdated(event: ProjectUpdated): void {
  let project = loadOrCreate(event.params.id);
  project.metadataURI = event.params.metadataURI;
  project.updatedAt = event.block.timestamp;
  project.save();
}

export function handleProjectVerified(event: ProjectVerified): void {
  let project = loadOrCreate(event.params.id);
  project.verification = verificationLabel(event.params.verification);
  project.identityRef = event.params.identityRef;
  project.owner = event.params.owner;
  project.updatedAt = event.block.timestamp;
  project.save();
}

export function handleProjectOwnerTransferred(event: ProjectOwnerTransferred): void {
  let project = loadOrCreate(event.params.id);
  project.owner = event.params.to;
  project.updatedAt = event.block.timestamp;
  project.save();
}
