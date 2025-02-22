import { AppBar, Toolbar, Box, Button, SvgIcon } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { ReactComponent as MenuIcon } from "../../assets/icons/hamburger.svg";
// import OhmMenu from "./OhmMenu.jsx";
import ThemeSwitcher from "./ThemeSwitch.jsx";
import LocaleSwitcher from "./LocaleSwitch.tsx";
import "./topbar.scss";
import Wallet from "./Wallet";

const useStyles = makeStyles(theme => ({
  appBar: {
    [theme.breakpoints.up("sm")]: {
      width: "100%",
      padding: "10px",
    },
    justifyContent: "flex-end",
    alignItems: "flex-end",
    background: "transparent",
    backdropFilter: "none",
    zIndex: 10,
  },
  menuButton: {
    marginRight: theme.spacing(2),
    [theme.breakpoints.up("981")]: {
      display: "none",
    },
  },
}));

function TopBar({ theme, toggleTheme, handleDrawerToggle }) {
  const classes = useStyles();
  const isVerySmallScreen = useMediaQuery("(max-width: 355px)");

  return (
    <AppBar position="sticky" className={classes.appBar} elevation={0}>
      <Toolbar disableGutters className="dapp-topbar">
        <Button
          id="hamburger"
          aria-label="open drawer"
          edge="start"
          size="large"
          variant="contained"
          color="secondary"
          onClick={handleDrawerToggle}
          className={classes.menuButton}
        >
          <SvgIcon component={MenuIcon} />
        </Button>
        <span style={{ display: "flex", flexWrap: "wrap" }}>
          {/* <span style={{ fontSize: "45px", paddingRight: "670px", fontWeight: "bold" }}>DASHBOARD</span> */}
          <Box display="flex">
            {/* {!isVerySmallScreen && <OhmMenu />} /}
            <Wallet />
            {/ <ConnectMenu /> */}
            <Wallet />
            <ThemeSwitcher theme={theme} toggleTheme={toggleTheme} />
            <LocaleSwitcher />
          </Box>
        </span>
      </Toolbar>
    </AppBar>
  );
}

export default TopBar;
