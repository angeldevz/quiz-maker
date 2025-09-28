import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Box, Button, List, ListItemText, Typography } from "@mui/material";
import { useState } from "react";

interface TimestampData {
  timestamp: Date;
}

interface Props {
  type: string;
  events: TimestampData[];
}
export function Stats({ type, events }: Props) {
  const [expanded, setExpanded] = useState(false);

  function toggle() {
    setExpanded(!expanded);
  }
  return (
    <Box sx={{ position: "relative" }}>
      <Typography variant="subtitle1">
        {type} : <strong>{events.length}</strong>{" "}
        <Button onClick={toggle}>
          <ExpandMoreIcon />
        </Button>
      </Typography>
      <Box
        sx={{
          display: expanded ? "block" : "none",
          position: "absolute",
          backgroundColor: "grey.600",
          borderRadius: 2,
          zIndex: 1,
        }}
      >
        <List>
          {events.map((item, index) => (
            <ListItemText
              key={index}
              sx={{
                display: "list-item", // show bullet
                listStyleType: "disc", // bullet style
                px: 1,
                ml: 3,
              }}
            >
              {item.timestamp.toLocaleTimeString()}
            </ListItemText>
          ))}
        </List>
      </Box>
    </Box>
  );
}
