// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ProjectRegistry} from "../src/ProjectRegistry.sol";

contract ProjectRegistryTest is Test {
    ProjectRegistry internal registry;
    address internal owner = address(0xA11CE);
    address internal stranger = address(0xB0B);

    bytes32 internal id = keccak256("ethbid-demo");
    bytes32 internal ensNode = keccak256("ghoste.eth");

    function setUp() public {
        registry = new ProjectRegistry();
        vm.prank(owner);
        registry.register(id, "ipfs://project");
    }

    function test_registerSetsOwner() public view {
        ProjectRegistry.Project memory project = registry.getProject(id);
        assertEq(project.owner, owner);
        assertEq(uint256(project.verification), uint256(ProjectRegistry.Verification.None));
    }

    function test_registerRejectsDuplicate() public {
        vm.prank(owner);
        vm.expectRevert(ProjectRegistry.AlreadyRegistered.selector);
        registry.register(id, "ipfs://dup");
    }

    function test_strangerCannotUpdate() public {
        vm.prank(stranger);
        vm.expectRevert(ProjectRegistry.NotOwner.selector);
        registry.updateMetadata(id, "ipfs://hack");
    }

    function test_ownerUpdatesMetadata() public {
        vm.prank(owner);
        registry.updateMetadata(id, "ipfs://v2");
        assertEq(registry.getProject(id).metadataURI, "ipfs://v2");
    }

    function test_verifyEnsAndIdentityLock() public {
        vm.prank(owner);
        registry.verify(id, ProjectRegistry.Verification.Ens, ensNode);
        ProjectRegistry.Project memory project = registry.getProject(id);
        assertEq(uint256(project.verification), uint256(ProjectRegistry.Verification.Ens));
        assertEq(project.identityRef, ensNode);

        bytes32 other = keccak256("other");
        vm.prank(owner);
        registry.register(other, "ipfs://other");
        vm.prank(owner);
        vm.expectRevert(ProjectRegistry.IdentityTaken.selector);
        registry.verify(other, ProjectRegistry.Verification.Ens, ensNode);
    }

    function test_transferOwnerThenOnlyNewOwnerCanEdit() public {
        vm.prank(owner);
        registry.transferOwner(id, stranger);
        assertEq(registry.getProject(id).owner, stranger);

        vm.prank(owner);
        vm.expectRevert(ProjectRegistry.NotOwner.selector);
        registry.updateMetadata(id, "ipfs://nope");

        vm.prank(stranger);
        registry.updateMetadata(id, "ipfs://yes");
        assertEq(registry.getProject(id).metadataURI, "ipfs://yes");
    }

    function test_zeroAddressTransferReverts() public {
        vm.prank(owner);
        vm.expectRevert(ProjectRegistry.ZeroAddress.selector);
        registry.transferOwner(id, address(0));
    }
}
