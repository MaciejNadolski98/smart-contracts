pragma solidity ^0.4.23;

import "./modularERC20/ModularPausableToken.sol";

/**
 * @title Compliant Token
 */
contract CompliantToken is ModularPausableToken {
    // In order to deposit USD and receive newly minted TrueUSD, or to burn TrueUSD to
    // redeem it for USD, users must first go through a KYC/AML check (which includes proving they
    // control their ethereum address using AddressValidation.sol).
    bytes32 public constant HAS_PASSED_KYC_AML = "hasPassedKYC/AML";
    // Redeeming ("burning") TrueUSD tokens for USD requires a separate flag since
    // users must not only be KYC/AML'ed but must also have bank information on file.
    bytes32 public constant CAN_BURN = "canBurn";
    // Addresses can also be blacklisted, preventing them from sending or receiving
    // TrueUSD. This can be used to prevent the use of TrueUSD by bad actors in
    // accordance with law enforcement. See [TrueCoin Terms of Use](https://www.trusttoken.com/trueusd/terms-of-use)
    bytes32 public constant IS_BLACKLISTED = "isBlacklisted";

    event WipeBlacklistedAccount(address indexed account, uint256 balance);
    event SetRegistry(address indexed registry);
    
    
    /**
    * @dev Point to the registry that contains all compliance related data
    @param _registry The address of the registry instance
    */
    function setRegistry(Registry _registry) public onlyOwner {
        registry = _registry;
        emit SetRegistry(registry);
    }

    function mint(address _to, uint256 _value) public onlyOwner {
        require(registry.hasAttribute1ButNotAttribute2(_to, HAS_PASSED_KYC_AML, IS_BLACKLISTED), "_to cannot mint");
        super.mint(_to, _value);
    }

    function _burnAllArgs(address _burner, uint256 _value) internal {
        require(registry.hasAttribute1ButNotAttribute2(_burner, CAN_BURN, IS_BLACKLISTED), "_burner cannot burn");
        super._burnAllArgs(_burner, _value);
    }

    // A blacklisted address can't call transferFrom
    function _transferFromAllArgs(address _from, address _to, uint256 _value, address _spender) internal {
        require(!registry.hasAttribute(_spender, IS_BLACKLISTED), "_spender is blacklisted");
        super._transferFromAllArgs(_from, _to, _value, _spender);
    }

    // transfer and transferFrom both call this function, so check blacklist here.
    function _transferAllArgs(address _from, address _to, uint256 _value) internal {
        require(!registry.eitherHaveAttribute(_from, _to, IS_BLACKLISTED), "blacklisted");
        super._transferAllArgs(_from, _to, _value);
    }

    // Destroy the tokens owned by a blacklisted account
    function wipeBlacklistedAccount(address _account) public onlyOwner {
        require(registry.hasAttribute(_account, IS_BLACKLISTED), "_account is not blacklisted");
        uint256 oldValue = balanceOf(_account);
        balances.setBalance(_account, 0);
        totalSupply_ = totalSupply_.sub(oldValue);
        emit WipeBlacklistedAccount(_account, oldValue);
        emit Transfer(_account, address(0), oldValue);
    }
}