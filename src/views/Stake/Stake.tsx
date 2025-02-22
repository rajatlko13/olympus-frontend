import { useCallback, useState, useEffect, ChangeEvent, ChangeEventHandler } from "react";
import { useDispatch } from "react-redux";
import { usePathForNetwork } from "src/hooks/usePathForNetwork";
import { useHistory } from "react-router";
import {
  Box,
  Button,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  Link,
  OutlinedInput,
  Paper,
  Tab,
  Tabs,
  Typography,
  Zoom,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  Switch,
  useMediaQuery,
} from "@material-ui/core";
import { t, Trans } from "@lingui/macro";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";

import RebaseTimer from "../../components/RebaseTimer/RebaseTimer";
import TabPanel from "../../components/TabPanel";
import { getGohmBalFromSohm, trim } from "../../helpers";
import { changeApproval, changeStake } from "../../slices/StakeThunk";
import { changeApproval as changeGohmApproval } from "../../slices/WrapThunk";
import "./stake.scss";
import { useWeb3Context } from "src/hooks/web3Context";
import { isPendingTxn, txnButtonText } from "src/slices/PendingTxnsSlice";
import { Skeleton } from "@material-ui/lab";
import ExternalStakePool from "./ExternalStakePool";
import { error } from "../../slices/MessagesSlice";
import { ethers } from "ethers";
import ZapCta from "../Zap/ZapCta";
import { useAppSelector } from "src/hooks";
import { ExpandMore } from "@material-ui/icons";
import StakeRow from "./StakeRow";
import { Metric, MetricCollection } from "../../components/Metric";
import { ConfirmDialog } from "./ConfirmDialog";

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

function Stake() {
  const dispatch = useDispatch();
  const history = useHistory();
  const { provider, address, connect, networkId } = useWeb3Context();
  usePathForNetwork({ pathName: "stake", networkID: networkId, history });

  const [zoomed, setZoomed] = useState(false);
  const [view, setView] = useState(0);
  const [quantity, setQuantity] = useState("");
  const [confirmation, setConfirmation] = useState(true);

  const isAppLoading = useAppSelector(state => state.app.loading);
  const currentIndex = useAppSelector(state => {
    return state.app.currentIndex ?? "1";
  });
  const fiveDayRate = useAppSelector(state => {
    return state.app.fiveDayRate;
  });
  const ohmBalance = useAppSelector(state => {
    return state.account.balances && state.account.balances.ohm;
  });
  const sohmBalance = useAppSelector(state => {
    return state.account.balances && state.account.balances.sohm;
  });
  const sohmV1Balance = useAppSelector(state => {
    return state.account.balances && state.account.balances.sohmV1;
  });
  const fsohmBalance = useAppSelector(state => {
    return state.account.balances && state.account.balances.fsohm;
  });
  const fgohmBalance = useAppSelector(state => {
    return state.account.balances && state.account.balances.fgohm;
  });
  const fgOHMAsfsOHMBalance = useAppSelector(state => {
    return state.account.balances && state.account.balances.fgOHMAsfsOHM;
  });
  const wsohmBalance = useAppSelector(state => {
    return state.account.balances && state.account.balances.wsohm;
  });
  const fiatDaowsohmBalance = useAppSelector(state => {
    return state.account.balances && state.account.balances.fiatDaowsohm;
  });
  const calculateWrappedAsSohm = (balance: string) => {
    return Number(balance) * Number(currentIndex);
  };
  const fiatDaoAsSohm = calculateWrappedAsSohm(fiatDaowsohmBalance);
  const gOhmBalance = useAppSelector(state => {
    return state.account.balances && state.account.balances.gohm;
  });

  const gOhmAsSohm = useAppSelector(state => {
    return state.account.balances && state.account.balances.gOhmAsSohmBal;
  });
  const wsohmAsSohm = calculateWrappedAsSohm(wsohmBalance);

  const stakeAllowance = useAppSelector(state => {
    return (state.account.staking && state.account.staking.ohmStake) || 0;
  });
  const unstakeAllowance = useAppSelector(state => {
    return (state.account.staking && state.account.staking.ohmUnstake) || 0;
  });

  const directUnstakeAllowance = useAppSelector(state => {
    return (state.account.wrapping && state.account.wrapping.gOhmUnwrap) || 0;
  });

  const stakingRebase = useAppSelector(state => {
    return state.app.stakingRebase || 0;
  });
  const stakingAPY = useAppSelector(state => {
    return state.app.stakingAPY || 0;
  });
  const stakingTVL = useAppSelector(state => {
    return state.app.stakingTVL || 0;
  });

  const pendingTransactions = useAppSelector(state => {
    return state.pendingTransactions;
  });

  const setMax = () => {
    if (view === 0) {
      setQuantity(ohmBalance);
    } else if (!confirmation) {
      setQuantity(sohmBalance);
    } else if (confirmation) {
      setQuantity(gOhmAsSohm.toString());
    }
  };

  const onSeekApproval = async (token: string) => {
    if (token === "gohm") {
      await dispatch(changeGohmApproval({ address, token: token.toLowerCase(), provider, networkID: networkId }));
    } else {
      await dispatch(changeApproval({ address, token, provider, networkID: networkId, version2: true }));
    }
  };

  const onChangeStake = async (action: string) => {
    // eslint-disable-next-line no-restricted-globals
    if (isNaN(Number(quantity)) || Number(quantity) === 0 || Number(quantity) < 0) {
      // eslint-disable-next-line no-alert
      return dispatch(error(t`Please enter a value!`));
    }

    // 1st catch if quantity > balance
    let gweiValue = ethers.utils.parseUnits(quantity.toString(), "gwei");
    if (action === "stake" && gweiValue.gt(ethers.utils.parseUnits(ohmBalance, "gwei"))) {
      return dispatch(error(t`You cannot stake more than your OHM balance.`));
    }

    if (confirmation === false && action === "unstake" && gweiValue.gt(ethers.utils.parseUnits(sohmBalance, "gwei"))) {
      return dispatch(
        error(
          t`You do not have enough sOHM to complete this transaction.  To unstake from gOHM, please toggle the sohm-gohm switch.`,
        ),
      );
    }

    /**
     * converts sOHM quantity to gOHM quantity when box is checked for gOHM staking
     * @returns sOHM as gOHM quantity
     */
    // const formQuant = checked && currentIndex && view === 1 ? quantity / Number(currentIndex) : quantity;
    const formQuant = async () => {
      if (confirmation && currentIndex && view === 1) {
        return await getGohmBalFromSohm({ provider, networkID: networkId, sOHMbalance: quantity });
      } else {
        return quantity;
      }
    };

    await dispatch(
      changeStake({
        address,
        action,
        value: await formQuant(),
        provider,
        networkID: networkId,
        version2: true,
        rebase: !confirmation,
      }),
    );
  };

  const hasAllowance = useCallback(
    token => {
      if (token === "ohm") return stakeAllowance > 0;
      if (token === "sohm") return unstakeAllowance > 0;
      if (token === "gohm") return directUnstakeAllowance > 0;
      return 0;
    },
    [stakeAllowance, unstakeAllowance, directUnstakeAllowance],
  );

  const isAllowanceDataLoading = (stakeAllowance == null && view === 0) || (unstakeAllowance == null && view === 1);

  let modalButton = [];

  modalButton.push(
    <Button variant="contained" color="primary" className="connect-button" onClick={connect} key={1}>
      <Trans>Connect Wallet</Trans>
    </Button>,
  );

  const changeView = (_event: React.ChangeEvent<{}>, newView: number) => {
    setView(newView);
  };

  const handleChangeQuantity = useCallback<ChangeEventHandler<HTMLInputElement>>(e => {
    if (Number(e.target.value) >= 0) setQuantity(e.target.value);
  }, []);

  const trimmedBalance = Number(
    [sohmBalance, gOhmAsSohm, sohmV1Balance, wsohmAsSohm, fiatDaoAsSohm, fsohmBalance, fgOHMAsfsOHMBalance]
      .filter(Boolean)
      .map(balance => Number(balance))
      .reduce((a, b) => a + b, 0)
      .toFixed(4),
  );
  const trimmedStakingAPY = trim(stakingAPY * 100, 1);

  const stakingRebasePercentage = trim(stakingRebase * 100, 4);
  const nextRewardValue = trim((Number(stakingRebasePercentage) / 100) * trimmedBalance, 4);

  const formattedTrimmedStakingAPY = new Intl.NumberFormat("en-US").format(Number(trimmedStakingAPY));
  const formattedStakingTVL = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(stakingTVL);
  const formattedCurrentIndex = trim(Number(currentIndex), 1);

  const isSmallScreen = useMediaQuery("(max-width: 733px)"); // change to breakpoint query
  const isVerySmallScreen = useMediaQuery("(max-width: 420px)");

  return (
    <div id="stake-view">
      <span className="header-text">STAKE</span>
      <div>
        <Typography variant="h3" style={{ fontWeight: "bold", paddingTop: "30px", paddingBottom: "10px" }}>
          SINGLE STAKE (3, 3)
        </Typography>
        <div style={{ textAlign: "center", paddingBottom: "30px" }}>
          <RebaseTimer />
        </div>
      </div>

      <Box className="stake-metrics">
        <Paper className="ohm-card">
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-evenly", alignItems: "center" }}>
            <span style={isVerySmallScreen ? { marginBottom: "10px" } : {}}>
              <Metric
                className="stake-apy"
                label={t`APY`}
                metric={`${formattedTrimmedStakingAPY}%`}
                isLoading={stakingAPY ? false : true}
              />
            </span>
            {!isSmallScreen && <span style={{ borderLeft: "2px solid white", height: "120px" }}></span>}
            <span>
              <Metric
                className="stake-tvl"
                label={t`TOTAL VALUE DEPOSITED`}
                metric={formattedStakingTVL}
                isLoading={stakingTVL ? false : true}
              />
            </span>
            {!isSmallScreen && <span style={{ borderLeft: "2px solid white", height: "120px" }}></span>}
            <span>
              <Metric
                className="stake-index"
                label={t`CURRENT INDEX`}
                metric={`${formattedCurrentIndex} sOHM`}
                isLoading={currentIndex ? false : true}
              />
            </span>
          </div>
        </Paper>
      </Box>

      <Zoom in={true} onEntered={() => setZoomed(true)}>
        <div className="staking-area">
          {!address ? (
            <div className="stake-wallet-notification">
              <div className="wallet-menu" id="wallet-menu">
                {modalButton}
              </div>
              <Typography variant="h6">
                <Trans>Connect your wallet to stake OHM</Trans>
              </Typography>
            </div>
          ) : (
            <>
              <Box className="stake-action-area">
                <Tabs
                  key={String(zoomed)}
                  centered
                  value={view}
                  textColor="primary"
                  indicatorColor="primary"
                  className="stake-tab-buttons"
                  onChange={changeView}
                  aria-label="stake tabs"
                  //hides the tab underline sliding animation in while <Zoom> is loading
                  TabIndicatorProps={!zoomed ? { style: { display: "none" } } : undefined}
                >
                  <Tab
                    label={t({
                      id: "do_stake",
                      comment: "The action of staking (verb)",
                    })}
                    {...a11yProps(0)}
                  />
                  <Tab label={t`Unstake`} {...a11yProps(1)} />
                </Tabs>
                <Grid container className="stake-action-row">
                  <Grid item xs={12} sm={8} className="stake-grid-item">
                    {address && !isAllowanceDataLoading ? (
                      (!hasAllowance("ohm") && view === 0) ||
                      (!hasAllowance("sohm") && view === 1 && !confirmation) ||
                      (!hasAllowance("gohm") && view === 1 && confirmation) ? (
                        <Box className="help-text">
                          <Typography variant="body1" className="stake-note" color="textSecondary">
                            {view === 0 ? (
                              <>
                                <Trans>First time staking</Trans> <b>OHM</b>?
                                <br />
                                <Trans>Please approve Olympus Dao to use your</Trans> <b>OHM</b>{" "}
                                <Trans>for staking</Trans>.
                              </>
                            ) : (
                              <>
                                <Trans>First time unstaking</Trans> <b>sOHM</b>?
                                <br />
                                <Trans>Please approve Olympus Dao to use your</Trans> <b>sOHM</b>{" "}
                                <Trans>for unstaking</Trans>.
                              </>
                            )}
                          </Typography>
                        </Box>
                      ) : (
                        <FormControl
                          className="ohm-input"
                          variant="outlined"
                          color="primary"
                          style={{ backgroundColor: "white", borderRadius: "5%" }}
                        >
                          {/* <InputLabel htmlFor="amount-input"></InputLabel> */}
                          <OutlinedInput
                            id="amount-input"
                            type="number"
                            placeholder="Amount"
                            className="stake-input"
                            value={quantity}
                            onChange={handleChangeQuantity}
                            labelWidth={0}
                            endAdornment={
                              <InputAdornment position="end">
                                <Button variant="text" onClick={setMax} color="inherit">
                                  Max
                                </Button>
                              </InputAdornment>
                            }
                          />
                        </FormControl>
                      )
                    ) : (
                      <Skeleton width="150px" />
                    )}
                  </Grid>
                  <Grid item xs={12} sm={4} className="stake-grid-item">
                    <TabPanel value={view} index={0} className="stake-tab-panel">
                      <Box m={-2}>
                        {isAllowanceDataLoading ? (
                          <Skeleton />
                        ) : address && hasAllowance("ohm") ? (
                          <Button
                            className="stake-button"
                            variant="contained"
                            disabled={isPendingTxn(pendingTransactions, "staking")}
                            onClick={() => {
                              onChangeStake("stake");
                            }}
                            style={{ backgroundColor: "#EEC378" }}
                          >
                            {txnButtonText(pendingTransactions, "staking", t`Stake OHM`)}
                          </Button>
                        ) : (
                          <Button
                            className="stake-button"
                            variant="contained"
                            disabled={isPendingTxn(pendingTransactions, "approve_staking")}
                            onClick={() => {
                              onSeekApproval("ohm");
                            }}
                            style={{ backgroundColor: "#EEC378" }}
                          >
                            {txnButtonText(pendingTransactions, "approve_staking", t`Approve`)}
                          </Button>
                        )}
                      </Box>
                    </TabPanel>

                    <TabPanel value={view} index={1} className="stake-tab-panel">
                      <Box m={-2}>
                        {isAllowanceDataLoading ? (
                          <Skeleton />
                        ) : (address && hasAllowance("sohm") && !confirmation) ||
                          (hasAllowance("gohm") && confirmation) ? (
                          <Button
                            className="stake-button"
                            variant="contained"
                            disabled={isPendingTxn(pendingTransactions, "unstaking")}
                            onClick={() => {
                              onChangeStake("unstake");
                            }}
                            style={{ backgroundColor: "#EEC378" }}
                          >
                            {txnButtonText(pendingTransactions, "unstaking", t`Unstake`)}
                          </Button>
                        ) : (
                          <Button
                            className="stake-button"
                            variant="contained"
                            disabled={isPendingTxn(pendingTransactions, "approve_unstaking")}
                            onClick={() => {
                              onSeekApproval(confirmation ? "gohm" : "sohm");
                            }}
                            style={{ backgroundColor: "#EEC378" }}
                          >
                            {txnButtonText(pendingTransactions, "approve_unstaking", t`Approve`)}
                          </Button>
                        )}
                      </Box>
                    </TabPanel>
                  </Grid>
                </Grid>
              </Box>
              {/* <ConfirmDialog quantity={quantity} currentIndex={currentIndex} view={view} onConfirm={setConfirmation} /> */}
              <div className="stake-user-data">
                <StakeRow
                  title={t`UNSTAKED BALANCE`}
                  id="user-balance"
                  balance={`${trim(Number(ohmBalance), 4)} OHM`}
                  {...{ isAppLoading }}
                />
                <Accordion className="stake-accordion" square defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMore className="stake-expand" />}>
                    <StakeRow
                      title={t`STAKED BALANCE`}
                      id="user-staked-balance"
                      balance={`${trimmedBalance} sOHM`}
                      {...{ isAppLoading }}
                    />
                  </AccordionSummary>
                  <AccordionDetails>
                    <StakeRow
                      title={t`SINGLE STAKING`}
                      balance={`${trim(Number(sohmBalance), 4)} sOHM`}
                      indented
                      {...{ isAppLoading }}
                    />
                    {/* <StakeRow
                      title={`${t`Wrapped Balance`}`}
                      balance={`${trim(Number(gOhmBalance), 4)} gOHM`}
                      indented
                      {...{ isAppLoading }}
                    />
                    {Number(fgohmBalance) > 0.00009 && (
                      <StakeRow
                        title={`${t`Wrapped Balance in Fuse`}`}
                        balance={`${trim(Number(fgohmBalance), 4)} gOHM`}
                        indented
                        {...{ isAppLoading }}
                      />
                    )}
                    {Number(sohmV1Balance) > 0.00009 && (
                      <StakeRow
                        title={`${t`Single Staking`} (v1)`}
                        balance={`${trim(Number(sohmV1Balance), 4)} sOHM (v1)`}
                        indented
                        {...{ isAppLoading }}
                      />
                    )}
                    {Number(wsohmBalance) > 0.00009 && (
                      <StakeRow
                        title={`${t`Wrapped Balance`} (v1)`}
                        balance={`${trim(Number(wsohmBalance), 4)} wsOHM (v1)`}
                        {...{ isAppLoading }}
                        indented
                      />
                    )}
                    {Number(fiatDaowsohmBalance) > 0.00009 && (
                      <StakeRow
                        title={t`Wrapped Balance in FiatDAO`}
                        balance={`${trim(Number(fiatDaowsohmBalance), 4)} wsOHM (v1)`}
                        {...{ isAppLoading }}
                        indented
                      />
                    )}
                    {Number(fsohmBalance) > 0.00009 && (
                      <StakeRow
                        title={t`Staked Balance in Fuse`}
                        balance={`${trim(Number(fsohmBalance), 4)} sOHM (v1)`}
                        indented
                        {...{ isAppLoading }}
                      />
                    )} */}
                  </AccordionDetails>
                </Accordion>
                <Divider color="secondary" style={{ margin: "20px" }} />
                <StakeRow title={t`NEXT REWARD AMOUNT`} balance={`${nextRewardValue} sOHM`} {...{ isAppLoading }} />
                <StakeRow title={t`NEXT REWARD YIELD`} balance={`${stakingRebasePercentage}%`} {...{ isAppLoading }} />
                <StakeRow
                  title={t`ROI (5-Day Rate)`}
                  balance={`${trim(Number(fiveDayRate) * 100, 4)}%`}
                  {...{ isAppLoading }}
                />
              </div>
            </>
          )}
        </div>
      </Zoom>

      {/* <Zoom in={true} onEntered={() => setZoomed(true)}>
        <Paper className={`ohm-card`}>
          <Grid container direction="column" spacing={2}>
            <Grid item>
              <div className="card-header">
                <Typography variant="h5">Single Stake (3, 3)</Typography>
                <RebaseTimer />
              </div>
            </Grid>

            <Grid item>
              <MetricCollection>
                <Metric
                  className="stake-apy"
                  label={t`APY`}
                  metric={`${formattedTrimmedStakingAPY}%`}
                  isLoading={stakingAPY ? false : true}
                />
                <Metric
                  className="stake-tvl"
                  label={t`Total Value Deposited`}
                  metric={formattedStakingTVL}
                  isLoading={stakingTVL ? false : true}
                />
                <Metric
                  className="stake-index"
                  label={t`Current Index`}
                  metric={`${formattedCurrentIndex} sOHM`}
                  isLoading={currentIndex ? false : true}
                />
              </MetricCollection>
            </Grid>

            <div className="staking-area">
              {!address ? (
                <div className="stake-wallet-notification">
                  <div className="wallet-menu" id="wallet-menu">
                    {modalButton}
                  </div>
                  <Typography variant="h6">
                    <Trans>Connect your wallet to stake OHM</Trans>
                  </Typography>
                </div>
              ) : (
                <>
                  <Box className="stake-action-area">
                    <Tabs
                      key={String(zoomed)}
                      centered
                      value={view}
                      textColor="primary"
                      indicatorColor="primary"
                      className="stake-tab-buttons"
                      onChange={changeView}
                      aria-label="stake tabs"
                      //hides the tab underline sliding animation in while <Zoom> is loading
                      TabIndicatorProps={!zoomed ? { style: { display: "none" } } : undefined}
                    >
                      <Tab
                        label={t({
                          id: "do_stake",
                          comment: "The action of staking (verb)",
                        })}
                        {...a11yProps(0)}
                      />
                      <Tab label={t`Unstake`} {...a11yProps(1)} />
                    </Tabs>
                    <Grid container className="stake-action-row">
                      <Grid item xs={12} sm={8} className="stake-grid-item">
                        {address && !isAllowanceDataLoading ? (
                          (!hasAllowance("ohm") && view === 0) ||
                          (!hasAllowance("sohm") && view === 1 && !confirmation) ||
                          (!hasAllowance("gohm") && view === 1 && confirmation) ? (
                            <Box className="help-text">
                              <Typography variant="body1" className="stake-note" color="textSecondary">
                                {view === 0 ? (
                                  <>
                                    <Trans>First time staking</Trans> <b>OHM</b>?
                                    <br />
                                    <Trans>Please approve Olympus Dao to use your</Trans> <b>OHM</b>{" "}
                                    <Trans>for staking</Trans>.
                                  </>
                                ) : (
                                  <>
                                    <Trans>First time unstaking</Trans> <b>sOHM</b>?
                                    <br />
                                    <Trans>Please approve Olympus Dao to use your</Trans> <b>sOHM</b>{" "}
                                    <Trans>for unstaking</Trans>.
                                  </>
                                )}
                              </Typography>
                            </Box>
                          ) : (
                            <FormControl className="ohm-input" variant="outlined" color="primary">
                              <InputLabel htmlFor="amount-input"></InputLabel>
                              <OutlinedInput
                                id="amount-input"
                                type="number"
                                placeholder="Enter an amount"
                                className="stake-input"
                                value={quantity}
                                onChange={handleChangeQuantity}
                                labelWidth={0}
                                endAdornment={
                                  <InputAdornment position="end">
                                    <Button variant="text" onClick={setMax} color="inherit">
                                      Max
                                    </Button>
                                  </InputAdornment>
                                }
                              />
                            </FormControl>
                          )
                        ) : (
                          <Skeleton width="150px" />
                        )}
                      </Grid>
                      <Grid item xs={12} sm={4} className="stake-grid-item">
                        <TabPanel value={view} index={0} className="stake-tab-panel">
                          <Box m={-2}>
                            {isAllowanceDataLoading ? (
                              <Skeleton />
                            ) : address && hasAllowance("ohm") ? (
                              <Button
                                className="stake-button"
                                variant="contained"
                                color="primary"
                                disabled={isPendingTxn(pendingTransactions, "staking")}
                                onClick={() => {
                                  onChangeStake("stake");
                                }}
                              >
                                {txnButtonText(pendingTransactions, "staking", t`Stake OHM`)}
                              </Button>
                            ) : (
                              <Button
                                className="stake-button"
                                variant="contained"
                                color="primary"
                                disabled={isPendingTxn(pendingTransactions, "approve_staking")}
                                onClick={() => {
                                  onSeekApproval("ohm");
                                }}
                              >
                                {txnButtonText(pendingTransactions, "approve_staking", t`Approve`)}
                              </Button>
                            )}
                          </Box>
                        </TabPanel>

                        <TabPanel value={view} index={1} className="stake-tab-panel">
                          <Box m={-2}>
                            {isAllowanceDataLoading ? (
                              <Skeleton />
                            ) : (address && hasAllowance("sohm") && !confirmation) ||
                              (hasAllowance("gohm") && confirmation) ? (
                              <Button
                                className="stake-button"
                                variant="contained"
                                color="primary"
                                disabled={isPendingTxn(pendingTransactions, "unstaking")}
                                onClick={() => {
                                  onChangeStake("unstake");
                                }}
                              >
                                {txnButtonText(pendingTransactions, "unstaking", t`Unstake`)}
                              </Button>
                            ) : (
                              <Button
                                className="stake-button"
                                variant="contained"
                                color="primary"
                                disabled={isPendingTxn(pendingTransactions, "approve_unstaking")}
                                onClick={() => {
                                  onSeekApproval(confirmation ? "gohm" : "sohm");
                                }}
                              >
                                {txnButtonText(pendingTransactions, "approve_unstaking", t`Approve`)}
                              </Button>
                            )}
                          </Box>
                        </TabPanel>
                      </Grid>
                    </Grid>
                  </Box>
                  <ConfirmDialog
                    quantity={quantity}
                    currentIndex={currentIndex}
                    view={view}
                    onConfirm={setConfirmation}
                  />
                  <div className="stake-user-data">
                    <StakeRow
                      title={t`Unstaked Balance`}
                      id="user-balance"
                      balance={`${trim(Number(ohmBalance), 4)} OHM`}
                      {...{ isAppLoading }}
                    />
                    <Accordion className="stake-accordion" square defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMore className="stake-expand" />}>
                        <StakeRow
                          title={t`Staked Balance`}
                          id="user-staked-balance"
                          balance={`${trimmedBalance} sOHM`}
                          {...{ isAppLoading }}
                        />
                      </AccordionSummary>
                      <AccordionDetails>
                        <StakeRow
                          title={t`Single Staking`}
                          balance={`${trim(Number(sohmBalance), 4)} sOHM`}
                          indented
                          {...{ isAppLoading }}
                        />
                        <StakeRow
                          title={`${t`Wrapped Balance`}`}
                          balance={`${trim(Number(gOhmBalance), 4)} gOHM`}
                          indented
                          {...{ isAppLoading }}
                        />
                        {Number(fgohmBalance) > 0.00009 && (
                          <StakeRow
                            title={`${t`Wrapped Balance in Fuse`}`}
                            balance={`${trim(Number(fgohmBalance), 4)} gOHM`}
                            indented
                            {...{ isAppLoading }}
                          />
                        )}
                        {Number(sohmV1Balance) > 0.00009 && (
                          <StakeRow
                            title={`${t`Single Staking`} (v1)`}
                            balance={`${trim(Number(sohmV1Balance), 4)} sOHM (v1)`}
                            indented
                            {...{ isAppLoading }}
                          />
                        )}
                        {Number(wsohmBalance) > 0.00009 && (
                          <StakeRow
                            title={`${t`Wrapped Balance`} (v1)`}
                            balance={`${trim(Number(wsohmBalance), 4)} wsOHM (v1)`}
                            {...{ isAppLoading }}
                            indented
                          />
                        )}
                        {Number(fiatDaowsohmBalance) > 0.00009 && (
                          <StakeRow
                            title={t`Wrapped Balance in FiatDAO`}
                            balance={`${trim(Number(fiatDaowsohmBalance), 4)} wsOHM (v1)`}
                            {...{ isAppLoading }}
                            indented
                          />
                        )}
                        {Number(fsohmBalance) > 0.00009 && (
                          <StakeRow
                            title={t`Staked Balance in Fuse`}
                            balance={`${trim(Number(fsohmBalance), 4)} sOHM (v1)`}
                            indented
                            {...{ isAppLoading }}
                          />
                        )}
                      </AccordionDetails>
                    </Accordion>
                    <Divider color="secondary" />
                    <StakeRow title={t`Next Reward Amount`} balance={`${nextRewardValue} sOHM`} {...{ isAppLoading }} />
                    <StakeRow
                      title={t`Next Reward Yield`}
                      balance={`${stakingRebasePercentage}%`}
                      {...{ isAppLoading }}
                    />
                    <StakeRow
                      title={t`ROI (5-Day Rate)`}
                      balance={`${trim(Number(fiveDayRate) * 100, 4)}%`}
                      {...{ isAppLoading }}
                    />
                  </div>
                </>
              )}
            </div>
          </Grid>
        </Paper>
      </Zoom>
      <ZapCta />
      <ExternalStakePool /> */}
    </div>
  );
}

export default Stake;
