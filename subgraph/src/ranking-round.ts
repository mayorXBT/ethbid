import { BigInt, Bytes, store } from "@graphprotocol/graph-ts";
import {
  BidIncreased,
  BidPlaced,
  BidWithdrawn,
  RoundFinalized,
  RoundStarted,
} from "../generated/RankingRound/RankingRound";
import { Bid, BidEvent, Project, Round } from "../generated/schema";
import { bidId, roundIdBytes } from "./ids";

function loadRound(id: Bytes): Round {
  let round = Round.load(id);
  if (round == null) {
    round = new Round(id);
    round.startedAt = BigInt.zero();
    round.endsAt = BigInt.zero();
    round.finalized = false;
  }
  return round;
}

function ensureProject(id: Bytes, owner: Bytes, timestamp: BigInt): Project {
  let project = Project.load(id);
  if (project == null) {
    project = new Project(id);
    project.owner = owner;
    project.verification = "None";
    project.identityRef = Bytes.empty();
    project.metadataURI = "";
    project.createdAt = timestamp;
    project.updatedAt = timestamp;
    project.save();
  }
  return project;
}

function writeBidEvent(
  eventTx: Bytes,
  logIndex: BigInt,
  kind: string,
  projectId: Bytes,
  roundId: Bytes,
  owner: Bytes,
  canonicalUsdc: BigInt,
  timestamp: BigInt,
): void {
  let row = new BidEvent(eventTx.concatI32(logIndex.toI32()));
  row.kind = kind;
  row.project = projectId;
  row.round = roundId;
  row.owner = owner;
  row.canonicalUsdc = canonicalUsdc;
  row.timestamp = timestamp;
  row.txHash = eventTx;
  row.save();
}

export function handleRoundStarted(event: RoundStarted): void {
  let id = roundIdBytes(event.params.roundId);
  let round = loadRound(id);
  round.startedAt = event.params.start;
  round.endsAt = event.params.end;
  round.finalized = false;
  round.save();
}

export function handleBidPlaced(event: BidPlaced): void {
  let roundId = roundIdBytes(event.params.roundId);
  loadRound(roundId).save();
  ensureProject(event.params.projectId, event.params.owner, event.block.timestamp);
  let id = bidId(roundId, event.params.projectId);
  let bid = new Bid(id);
  bid.project = event.params.projectId;
  bid.round = roundId;
  bid.owner = event.params.owner;
  bid.canonicalUsdc = event.params.total;
  bid.createdAt = event.block.timestamp;
  bid.txHash = event.transaction.hash;
  bid.save();
  writeBidEvent(
    event.transaction.hash,
    event.logIndex,
    "placed",
    event.params.projectId,
    roundId,
    event.params.owner,
    event.params.total,
    event.block.timestamp,
  );
}

export function handleBidIncreased(event: BidIncreased): void {
  let roundId = roundIdBytes(event.params.roundId);
  loadRound(roundId).save();
  ensureProject(event.params.projectId, event.params.owner, event.block.timestamp);
  let id = bidId(roundId, event.params.projectId);
  let bid = Bid.load(id);
  if (bid == null) {
    bid = new Bid(id);
    bid.project = event.params.projectId;
    bid.round = roundId;
    bid.owner = event.params.owner;
    bid.createdAt = event.block.timestamp;
  }
  bid.canonicalUsdc = event.params.total;
  bid.txHash = event.transaction.hash;
  bid.save();
  writeBidEvent(
    event.transaction.hash,
    event.logIndex,
    "increased",
    event.params.projectId,
    roundId,
    event.params.owner,
    event.params.total,
    event.block.timestamp,
  );
}

export function handleBidWithdrawn(event: BidWithdrawn): void {
  let roundId = roundIdBytes(event.params.roundId);
  let id = bidId(roundId, event.params.projectId);
  let bid = Bid.load(id);
  if (bid != null) {
    store.remove("Bid", id.toHexString());
  }
  writeBidEvent(
    event.transaction.hash,
    event.logIndex,
    "withdrawn",
    event.params.projectId,
    roundId,
    event.params.owner,
    event.params.amount,
    event.block.timestamp,
  );
}

export function handleRoundFinalized(event: RoundFinalized): void {
  let round = loadRound(roundIdBytes(event.params.roundId));
  round.finalized = true;
  round.save();
}
