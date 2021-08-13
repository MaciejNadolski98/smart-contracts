import { expect, use } from 'chai'
import { Wallet } from 'ethers'

import { beforeEachWithFixture, DAY, parseEth, parseUSDC } from 'utils'
import { setupDeploy } from 'scripts/utils'

import {
  TrueRateAdjuster,
  TrueRateAdjuster__factory,
  TrueFiPool2,
  TrueFiPool2__factory,
  TimeAveragedBaseRateOracle,
  TimeAveragedBaseRateOracle__factory,
} from 'contracts'

import { deployMockContract, MockContract, solidity } from 'ethereum-waffle'
import {
  ITrueFiPool2WithDecimalsJson,
  ITimeAveragedBaseRateOracleJson,
} from 'build'

use(solidity)

describe('TrueRateAdjuster', () => {
  let owner: Wallet
  let borrower: Wallet
  let rateAdjuster: TrueRateAdjuster
  let mockPool: MockContract

  beforeEachWithFixture(async (wallets) => {
    [owner, borrower] = wallets

    const deployContract = setupDeploy(owner)

    rateAdjuster = await deployContract(TrueRateAdjuster__factory)
    mockPool = await deployMockContract(owner, ITrueFiPool2WithDecimalsJson.abi)

    await rateAdjuster.initialize()
  })

  describe('initializer', () => {
    it('transfers ownership', async () => {
      expect(await rateAdjuster.owner()).to.eq(owner.address)
    })

    it('sets riskPremium', async () => {
      expect(await rateAdjuster.riskPremium()).to.eq(200)
    })

    it('sets credit adjustment coefficient', async () => {
      expect(await rateAdjuster.creditAdjustmentCoefficient()).to.eq(1000)
    })

    it('sets utilization adjustment coefficient', async () => {
      expect(await rateAdjuster.utilizationAdjustmentCoefficient()).to.eq(50)
    })

    it('sets utilization adjustment power', async () => {
      expect(await rateAdjuster.utilizationAdjustmentPower()).to.eq(2)
    })
  })

  describe('setRiskPremium', () => {
    it('reverts if caller is not the owner', async () => {
      await expect(rateAdjuster.connect(borrower).setRiskPremium(0))
        .to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('sets riskPremium', async () => {
      await rateAdjuster.setRiskPremium(300)
      expect(await rateAdjuster.riskPremium()).to.eq(300)
    })

    it('emits event', async () => {
      await expect(rateAdjuster.setRiskPremium(300))
        .to.emit(rateAdjuster, 'RiskPremiumChanged')
        .withArgs(300)
    })
  })

  describe('setCreditAdjustmentCoefficient', () => {
    it('reverts if caller is not the owner', async () => {
      await expect(rateAdjuster.connect(borrower).setCreditAdjustmentCoefficient(0))
        .to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('sets credit adjustment coefficient', async () => {
      await rateAdjuster.setCreditAdjustmentCoefficient(2000)
      expect(await rateAdjuster.creditAdjustmentCoefficient()).to.eq(2000)
    })

    it('emits event', async () => {
      await expect(rateAdjuster.setCreditAdjustmentCoefficient(2000))
        .to.emit(rateAdjuster, 'CreditAdjustmentCoefficientChanged')
        .withArgs(2000)
    })
  })

  describe('setUtilizationAdjustmentCoefficient', () => {
    it('reverts if caller is not the owner', async () => {
      await expect(rateAdjuster.connect(borrower).setUtilizationAdjustmentCoefficient(0))
        .to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('sets utilization adjustment coefficient', async () => {
      await rateAdjuster.setUtilizationAdjustmentCoefficient(100)
      expect(await rateAdjuster.utilizationAdjustmentCoefficient()).to.eq(100)
    })

    it('emits event', async () => {
      await expect(rateAdjuster.setUtilizationAdjustmentCoefficient(100))
        .to.emit(rateAdjuster, 'UtilizationAdjustmentCoefficientChanged')
        .withArgs(100)
    })
  })

  describe('setUtilizationAdjustmentPower', () => {
    it('reverts if caller is not the owner', async () => {
      await expect(rateAdjuster.connect(borrower).setUtilizationAdjustmentPower(0))
        .to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('sets utilization adjustment power', async () => {
      await rateAdjuster.setUtilizationAdjustmentPower(3)
      expect(await rateAdjuster.utilizationAdjustmentPower()).to.eq(3)
    })

    it('emits event', async () => {
      await expect(rateAdjuster.setUtilizationAdjustmentPower(3))
        .to.emit(rateAdjuster, 'UtilizationAdjustmentPowerChanged')
        .withArgs(3)
    })
  })

  describe('setBaseRateOracle', () => {
    let fakePool: TrueFiPool2
    let fakeOracle: TimeAveragedBaseRateOracle

    beforeEach(async () => {
      fakePool = await new TrueFiPool2__factory(owner).deploy()
      fakeOracle = await new TimeAveragedBaseRateOracle__factory(owner).deploy()
    })

    it('reverts if caller is not the owner', async () => {
      await expect(rateAdjuster.connect(borrower).setBaseRateOracle(fakePool.address, fakeOracle.address))
        .to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('sets base rate oracle', async () => {
      await rateAdjuster.setBaseRateOracle(fakePool.address, fakeOracle.address)
      expect(await rateAdjuster.baseRateOracle(fakePool.address)).to.eq(fakeOracle.address)
    })

    it('emits event', async () => {
      await expect(rateAdjuster.setBaseRateOracle(fakePool.address, fakeOracle.address))
        .to.emit(rateAdjuster, 'BaseRateOracleChanged')
        .withArgs(fakePool.address, fakeOracle.address)
    })
  })

  describe('setFixedTermLoanAdjustmentCoefficient', () => {
    it('reverts if caller is not the owner', async () => {
      await expect(rateAdjuster.connect(borrower).setFixedTermLoanAdjustmentCoefficient(0))
        .to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('sets fixed-term loan adjustment coefficient', async () => {
      await rateAdjuster.setFixedTermLoanAdjustmentCoefficient(50)
      expect(await rateAdjuster.fixedTermLoanAdjustmentCoefficient()).to.eq(50)
    })

    it('emits event', async () => {
      await expect(rateAdjuster.setFixedTermLoanAdjustmentCoefficient(50))
        .to.emit(rateAdjuster, 'FixedTermLoanAdjustmentCoefficientChanged')
        .withArgs(50)
    })
  })

  describe('setBorrowLimitConfig', () => {
    it('reverts if caller is not the owner', async () => {
      await expect(rateAdjuster.connect(borrower).setBorrowLimitConfig(0, 0, 0, 0))
        .to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('sets borrow limit config', async () => {
      await rateAdjuster.setBorrowLimitConfig(1, 2, 3, 4)
      const [scoreFloor, limitAdjustmentPower, tvlLimitCoefficient, poolValueLimitCoefficient] = await rateAdjuster.borrowLimitConfig()
      expect([scoreFloor, limitAdjustmentPower, tvlLimitCoefficient, poolValueLimitCoefficient]).to.deep.eq([1, 2, 3, 4])
    })

    it('emits event', async () => {
      await expect(rateAdjuster.setBorrowLimitConfig(1, 2, 3, 4))
        .to.emit(rateAdjuster, 'BorrowLimitConfigChanged')
        .withArgs(1, 2, 3, 4)
    })
  })

  describe('rate', () => {
    let mockOracle: MockContract

    beforeEach(async () => {
      mockOracle = await deployMockContract(owner, ITimeAveragedBaseRateOracleJson.abi)
      await mockOracle.mock.getWeeklyAPY.returns(300)
      await rateAdjuster.setBaseRateOracle(mockPool.address, mockOracle.address)
    })

    it('calculates rate correctly', async () => {
      await rateAdjuster.setRiskPremium(100)
      const borrowerScore = 223
      await mockPool.mock.liquidRatio.returns(10000 - 50 * 100)
      const expectedCurrentRate = 693 // 300 + 100 + 143 + 150
      expect(await rateAdjuster.rate(mockPool.address, borrowerScore)).to.eq(expectedCurrentRate)
    })

    it('caps current rate if it exceeds max rate', async () => {
      await rateAdjuster.setRiskPremium(22600)
      const borrowerScore = 31
      await mockPool.mock.liquidRatio.returns(10000 - 95 * 100)
      const expectedCurrentRate = 50000 // min(300 + 22600 + 7225 + 19950 = 50075, 50000)
      expect(await rateAdjuster.rate(mockPool.address, borrowerScore)).to.eq(expectedCurrentRate)
    })
  })

  describe('fixedTermLoanAdjustment', () => {
    beforeEach(async () => {
      await rateAdjuster.setFixedTermLoanAdjustmentCoefficient(25)
    })

    ;[
      [0, 0],
      [30 * DAY - 1, 0],
      [30 * DAY, 25],
      [60 * DAY - 1, 25],
      [60 * DAY, 50],
      [3.5 * 30 * DAY, 75],
      [180 * DAY, 150],
    ].map(([term, adjustment]) =>
      it(`returns adjustment of ${adjustment} basis points for term of ${term / DAY} days`, async () => {
        expect(await rateAdjuster.fixedTermLoanAdjustment(term)).to.eq(adjustment)
      }),
    )
  })

  describe('utilizationAdjustmentRate', () => {
    [
      [0, 0],
      [10, 11],
      [20, 28],
      [30, 52],
      [40, 88],
      [50, 150],
      [60, 262],
      [70, 505],
      [80, 1200],
      [90, 4950],
      [95, 19950],
      [99, 50000],
      [100, 50000],
    ].map(([utilization, adjustment]) =>
      it(`returns ${adjustment} if utilization is at ${utilization} percent`, async () => {
        await mockPool.mock.liquidRatio.returns(10000 - utilization * 100)
        expect(await rateAdjuster.utilizationAdjustmentRate(mockPool.address)).to.eq(adjustment)
      }),
    )
  })

  describe('borrowLimitAdjustment', () => {
    [
      [255, 10000],
      [223, 9043],
      [191, 8051],
      [159, 7016],
      [127, 5928],
      [95, 4768],
      [63, 3504],
      [31, 2058],
      [1, 156],
      [0, 0],
    ].map(([score, adjustment]) =>
      it(`returns ${adjustment} when score is ${score}`, async () => {
        expect(await rateAdjuster.borrowLimitAdjustment(score)).to.equal(adjustment)
      }),
    )
  })

  describe('Borrow limit', () => {
    beforeEach(async () => {
      await mockPool.mock.decimals.returns(18)
      await mockPool.mock.poolValue.returns(parseEth(1e7))
    })

    it('borrow amount is limited by borrower limit', async () => {
      expect(await rateAdjuster.borrowLimit(mockPool.address, 191, parseEth(100), parseEth(2e7), 0)).to.equal(parseEth(80.51)) // borrowLimitAdjustment(191)
    })

    it('borrow limit depends on decimal count of the pool', async () => {
      await mockPool.mock.decimals.returns(6)
      expect(await rateAdjuster.borrowLimit(mockPool.address, 191, parseEth(100), parseUSDC(2e7), 0)).to.equal(parseUSDC(80.51))
    })

    it('borrow amount is limited by total TVL', async () => {
      const maxTVLLimit = parseEth(10)
      expect(await rateAdjuster.borrowLimit(mockPool.address, 191, parseEth(100), maxTVLLimit, 0)).to.equal(maxTVLLimit.mul(15).div(100).mul(8051).div(10000))
    })

    it('borrow amount is limited by a single pool value', async () => {
      await mockPool.mock.poolValue.returns(parseUSDC(100))
      await mockPool.mock.decimals.returns(18)
      expect(await rateAdjuster.borrowLimit(mockPool.address, 191, parseEth(100), parseEth(2e7), 0)).to.equal(parseUSDC(100).mul(15).div(100))
    })

    it('subtracts borrowed amount from credit limit', async () => {
      expect(await rateAdjuster.borrowLimit(mockPool.address, 191, parseEth(100), parseEth(2e7), 100)).to.equal(parseEth(80.51).sub(100))
    })

    it('borrow limit is 0 if credit limit is below the borrowed amount', async () => {
      expect(await rateAdjuster.borrowLimit(mockPool.address, 191, parseEth(100), parseEth(2e7), parseEth(100))).to.equal(0)
    })
  })
})