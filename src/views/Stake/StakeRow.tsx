import { Typography } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";

interface StakeRowProps {
  title: string;
  indented?: boolean;
  id?: string;
  balance: string;
  isAppLoading?: boolean;
}

const StakeRow = (props: StakeRowProps) => {
  // var sty = {
  //   display: "flex",
  //   justifyContent: "end",
  //   paddingLeft: ""
  // };
  // if(props.indented)
  //   sty["paddingLeft"] = "10px";
  return (
    // <div className="data-row" style={{ display: "flex", justifyContent: "end" }}>
    //   <span>

    //   </span>
    // </div>
    <div
      className="data-row"
      style={
        props.indented
          ? { paddingLeft: "25px", display: "flex", justifyContent: "space-between", paddingBottom: "15px" }
          : { display: "flex", justifyContent: "space-between", paddingBottom: "15px" }
      }
    >
      <Typography
        color={props.indented ? "textSecondary" : "primary"}
        style={{ fontSize: props.indented ? "13px" : "16px", fontWeight: "bold" }}
      >
        {props.title}
      </Typography>
      <Typography
        id={props.id}
        color={props.indented ? "textSecondary" : "primary"}
        style={{ fontSize: props.indented ? "15px" : "18px" }}
      >
        {props.isAppLoading ? <Skeleton width="80px" /> : <>{props.balance}</>}
      </Typography>
    </div>
  );
};

export default StakeRow;
