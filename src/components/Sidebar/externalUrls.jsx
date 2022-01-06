import { ReactComponent as ForumIcon } from "../../assets/icons/forum.svg";
import { ReactComponent as GovIcon } from "../../assets/icons/governance.svg";
import { ReactComponent as DocsIcon } from "../../assets/icons/docs.svg";
import { ReactComponent as BridgeIcon } from "../../assets/icons/bridge.svg";
import { SvgIcon } from "@material-ui/core";
import { Trans } from "@lingui/macro";

const externalUrls = [
  {
    title: <Trans>Forum</Trans>,
    url: "https://forum.olympusdao.finance/",
    icon: <SvgIcon component={ForumIcon} />,
  },
  {
    title: <Trans>Governance</Trans>,
    url: "https://vote.olympusdao.finance/",
    icon: <SvgIcon component={GovIcon} />,
  },
  {
    title: <Trans>Docs</Trans>,
    url: "https://docs.olympusdao.finance/",
    icon: <SvgIcon component={DocsIcon} />,
  },
  // {
  //   title: "Feedback",
  //   url: "https://olympusdao.canny.io/",
  //   icon: <SvgIcon component={FeedbackIcon} />,
  // },
];

export default externalUrls;
