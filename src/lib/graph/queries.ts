export const CURRENT_LEADERBOARD = /* GraphQL */ `
  query CurrentLeaderboard($roundId: Bytes!) {
    bids(where: { round: $roundId }, orderBy: canonicalUsdc, orderDirection: desc, first: 100) {
      id
      canonicalUsdc
      createdAt
      txHash
      project { id owner verification identityRef metadataURI }
    }
  }
`;

export const PRODUCT = /* GraphQL */ `
  query Product($id: Bytes!) {
    project(id: $id) {
      id
      owner
      verification
      identityRef
      metadataURI
      bids(orderBy: createdAt, orderDirection: desc) {
        id
        canonicalUsdc
        createdAt
        txHash
        round { id }
      }
    }
  }
`;

export const PRODUCT_BID_HISTORY = /* GraphQL */ `
  query ProductBidHistory($projectId: Bytes!) {
    bidEvents(where: { project: $projectId }, orderBy: timestamp, orderDirection: desc) {
      id
      kind
      canonicalUsdc
      timestamp
      txHash
      owner
    }
  }
`;

export const ACTIVE_ROUND = /* GraphQL */ `
  query ActiveRound {
    rounds(where: { finalized: false }, first: 1, orderBy: startedAt, orderDirection: desc) {
      id
      startedAt
      endsAt
      finalized
    }
  }
`;

export const PREVIOUS_ROUNDS = /* GraphQL */ `
  query PreviousRounds {
    rounds(where: { finalized: true }, orderBy: endsAt, orderDirection: desc, first: 20) {
      id
      startedAt
      endsAt
      finalized
    }
  }
`;

export const VERIFIED_OWNER = /* GraphQL */ `
  query VerifiedOwner($id: Bytes!) {
    project(id: $id) {
      id
      owner
      verification
      identityRef
    }
  }
`;

export const RECENT_BID_ACTIVITY = /* GraphQL */ `
  query RecentBidActivity {
    bidEvents(first: 20, orderBy: timestamp, orderDirection: desc) {
      id
      kind
      canonicalUsdc
      timestamp
      txHash
      owner
      project { id }
      round { id }
    }
  }
`;

export const REQUIRED_QUERIES = [
  "CurrentLeaderboard",
  "Product",
  "ProductBidHistory",
  "ActiveRound",
  "PreviousRounds",
  "VerifiedOwner",
  "RecentBidActivity",
] as const;
