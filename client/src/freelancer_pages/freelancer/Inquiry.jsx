import React from "react";
import { Typography, Card, List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider } from "@mui/material";
import MailIcon from "@mui/icons-material/Mail";
 

export default function Inquiry() {
  return (
    <>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Work Inquiries</Typography>
      <Card>
        <List>
          {[1, 2, 3].map((i) => (
            <React.Fragment key={i}>
              <ListItem button>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: "#eff6ff", color: "#3b82f6" }}><MailIcon /></Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary="Project Proposal: Dashboard Design" 
                  secondary="Hey, we are looking for a designer to revamp our..." 
                />
                <Typography variant="caption" color="text.secondary">2 hrs ago</Typography>
              </ListItem>
              {i < 3 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Card>
    </>
  );
}