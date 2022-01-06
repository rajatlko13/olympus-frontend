import { SvgIcon, Link } from "@material-ui/core";
import { ReactComponent as GitHub } from "../../assets/icons/github.svg";
import { ReactComponent as Medium } from "../../assets/icons/medium.svg";
import { ReactComponent as Twitter } from "../../assets/icons/twitter.svg";
import { ReactComponent as Discord } from "../../assets/icons/discord.svg";

export default function Social() {
  return (
    <div className="social-row">
      <Link href="https://github.com/OlympusDAO" target="_blank">
        <SvgIcon component={GitHub} />
      </Link>

      <Link href="https://olympusdao.medium.com/" target="_blank">
        <SvgIcon component={Medium} />
      </Link>

      <Link href="https://twitter.com/OlympusDAO" target="_blank">
        <SvgIcon component={Twitter} />
      </Link>

      <Link href="https://discord.gg/6QjjtUcfM4" target="_blank">
        <SvgIcon component={Discord} />
      </Link>
    </div>
  );
}
