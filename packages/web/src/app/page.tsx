import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Container,
  Grid,
  Grow,
} from "@mui/material";
import Link from "next/link";

export default function Home() {
  return (
    <Container maxWidth="md">
      <Grid container spacing={4}>
        <Grid size={6}>
          <Grow in>
            <Card>
              <CardHeader title="Quiz Builder" />
              <CardContent>
                Create a quiz with coding-related questions
              </CardContent>
              <CardActions>
                <Button LinkComponent={Link} href={"/quiz-builder"}>
                  Create a quiz
                </Button>
              </CardActions>
            </Card>
          </Grow>
        </Grid>
        <Grid size={6}>
          <Grow in>
            <Card>
              <CardHeader title="Quiz Player" />
              <CardContent>Take a short quiz</CardContent>
              <CardActions>
                <Button LinkComponent={Link} href={"/quiz-player"}>
                  Take a quiz
                </Button>
              </CardActions>
            </Card>
          </Grow>
        </Grid>
      </Grid>
    </Container>
  );
}
