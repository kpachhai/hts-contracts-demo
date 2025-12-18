// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.32;

import "@hashgraph/smart-contracts/contracts/system-contracts/hedera-token-service/HederaTokenService.sol";
import "@hashgraph/smart-contracts/contracts/system-contracts/hedera-token-service/ExpiryHelper.sol";
import "@hashgraph/smart-contracts/contracts/system-contracts/hedera-token-service/KeyHelper.sol";
import "@hashgraph/smart-contracts/contracts/system-contracts/HederaResponseCodes.sol";
import "@hashgraph/smart-contracts/contracts/system-contracts/hedera-token-service/IHederaTokenService.sol";
import "@hashgraph/smart-contracts/contracts/system-contracts/hedera-token-service/FeeHelper.sol";

contract CreateAndManageHTSTokens is
    HederaTokenService,
    ExpiryHelper,
    KeyHelper,
    FeeHelper
{
    bool finiteTotalSupplyType = true;

    event ResponseCode(int responseCode);
    event CreatedToken(address tokenAddress);
    event FungibleTokenInfo(IHederaTokenService.FungibleTokenInfo tokenInfo);
    event TransferToken(address tokenAddress, address receiver, int64 amount);
    event MintedToken(int64 newTotalSupply, int64[] serialNumbers);

    function cryptoTransferPublic(
        IHederaTokenService.TransferList calldata transferList,
        IHederaTokenService.TokenTransferList[] calldata tokenTransferList
    ) public returns (int responseCode) {
        responseCode = HederaTokenService.cryptoTransfer(
            transferList,
            tokenTransferList
        );
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
    }

    function transferTokenPublic(
        address token,
        address sender,
        address receiver,
        int64 amount
    ) public returns (int responseCode) {
        responseCode = HederaTokenService.transferToken(
            token,
            sender,
            receiver,
            amount
        );
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
    }

    function transferFromPublic(
        address token,
        address from,
        address to,
        uint256 amount
    ) public returns (int64 responseCode) {
        responseCode = this.transferFrom(token, from, to, amount);
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
    }

    function approvePublic(
        address token,
        address spender,
        uint256 amount
    ) public returns (int responseCode) {
        responseCode = HederaTokenService.approve(token, spender, amount);
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
    }

    function createFungibleTokenPublic(
        string memory _name,
        string memory _symbol,
        string memory _memo,
        int64 _initialTotalSupply,
        int64 _maxSupply,
        int32 _decimals,
        bool _freezeDefaultStatus,
        address _treasury,
        IHederaTokenService.TokenKey[] memory _keys
    ) public payable {
        IHederaTokenService.Expiry memory expiry = IHederaTokenService.Expiry(
            0,
            _treasury,
            8000000
        );

        IHederaTokenService.HederaToken memory token = IHederaTokenService
            .HederaToken(
                _name,
                _symbol,
                _treasury,
                _memo,
                finiteTotalSupplyType,
                _maxSupply,
                _freezeDefaultStatus,
                _keys,
                expiry
            );

        (int responseCode, address tokenAddress) = HederaTokenService
            .createFungibleToken(token, _initialTotalSupply, _decimals);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
        emit CreatedToken(tokenAddress);
    }

    function mintTokenPublic(
        address token,
        int64 amount,
        bytes[] memory metadata
    )
        public
        returns (
            int responseCode,
            int64 newTotalSupply,
            int64[] memory serialNumbers
        )
    {
        (responseCode, newTotalSupply, serialNumbers) = HederaTokenService
            .mintToken(token, amount, metadata);
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }

        emit MintedToken(newTotalSupply, serialNumbers);
    }
}
