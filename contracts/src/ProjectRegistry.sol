// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ProjectRegistry {
    enum Verification {
        None,
        Ens,
        Domain
    }

    struct Project {
        bytes32 id;
        address owner;
        Verification verification;
        bytes32 identityRef;
        string metadataURI;
    }

    mapping(bytes32 => Project) private _projects;
    mapping(bytes32 => bool) private _identityUsed;

    event ProjectRegistered(
        bytes32 indexed id,
        address indexed owner,
        Verification verification,
        bytes32 identityRef,
        string metadataURI
    );
    event ProjectUpdated(bytes32 indexed id, string metadataURI);
    event ProjectVerified(
        bytes32 indexed id,
        Verification verification,
        bytes32 identityRef,
        address indexed owner
    );
    event ProjectOwnerTransferred(bytes32 indexed id, address indexed from, address indexed to);

    error ZeroAddress();
    error ZeroId();
    error AlreadyRegistered();
    error UnknownProject();
    error NotOwner();
    error IdentityTaken();
    error InvalidVerification();

    function getProject(bytes32 id) external view returns (Project memory) {
        if (_projects[id].owner == address(0)) revert UnknownProject();
        return _projects[id];
    }

    function register(bytes32 id, string calldata metadataURI) external {
        if (id == bytes32(0)) revert ZeroId();
        if (_projects[id].owner != address(0)) revert AlreadyRegistered();
        _projects[id] = Project({
            id: id,
            owner: msg.sender,
            verification: Verification.None,
            identityRef: bytes32(0),
            metadataURI: metadataURI
        });
        emit ProjectRegistered(id, msg.sender, Verification.None, bytes32(0), metadataURI);
    }

    function updateMetadata(bytes32 id, string calldata metadataURI) external {
        Project storage project = _requireOwner(id);
        project.metadataURI = metadataURI;
        emit ProjectUpdated(id, metadataURI);
    }

    function verify(bytes32 id, Verification verification, bytes32 identityRef) external {
        Project storage project = _requireOwner(id);
        if (verification == Verification.None || identityRef == bytes32(0)) revert InvalidVerification();
        if (_identityUsed[identityRef] && project.identityRef != identityRef) revert IdentityTaken();
        if (project.identityRef != bytes32(0) && project.identityRef != identityRef) {
            _identityUsed[project.identityRef] = false;
        }
        _identityUsed[identityRef] = true;
        project.verification = verification;
        project.identityRef = identityRef;
        emit ProjectVerified(id, verification, identityRef, msg.sender);
    }

    function transferOwner(bytes32 id, address nextOwner) external {
        if (nextOwner == address(0)) revert ZeroAddress();
        Project storage project = _requireOwner(id);
        address previous = project.owner;
        project.owner = nextOwner;
        emit ProjectOwnerTransferred(id, previous, nextOwner);
    }

    function _requireOwner(bytes32 id) internal view returns (Project storage project) {
        project = _projects[id];
        if (project.owner == address(0)) revert UnknownProject();
        if (project.owner != msg.sender) revert NotOwner();
    }
}
