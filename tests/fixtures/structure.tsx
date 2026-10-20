import { createRoot } from 'react-dom/client';
import { Badge, Button, DescriptionList, Field, FormActions, FormGrid, Grid, Heading, Inline, Input, Link, List, ListItem, Option, Select, Stack, Text } from '@ten98/ui';
import '@ten98/ui/app-tokens.css';
import '@ten98/ui/app.css';
import '@ten98/ui/product.css';

// Composed the way an application screen must be: library components only, no elements or styles.
document.documentElement.dataset.theme = new URLSearchParams(location.search).get('theme') || 'light';
const long = 'Quarterly performance for the Dubai launch across every paid and organic destination';

function Screen() {
  return <Stack as="main" gap={6} id="structure">
    <Stack gap={2}>
      <Heading level={1}>Campaign summary</Heading>
      <Text tone="muted">Studio / Dubai launch · <Link href="/reports">All reports</Link></Text>
    </Stack>
    <Inline justify="between" id="toolbar">
      <Inline><Badge tone="success">Live</Badge><Badge>12 destinations</Badge><Text as="span" truncate title={long} id="truncated">{long}</Text></Inline>
      <Inline><Button variant="secondary">Export</Button><Button>New campaign</Button></Inline>
    </Inline>
    <Grid columns={3} id="metrics">
      {['Reach', 'Clicks', 'Spend'].map(name => <Stack key={name} gap={1}><Text size="sm" tone="muted">{name}</Text><Text size="xl" weight="semibold" numeric>1,204,330</Text></Stack>)}
    </Grid>
    <Stack as="form" gap={4} action="/save" method="post" id="form">
      <Heading level={2}>Schedule</Heading>
      <Button variant="secondary" id="stacked-button">Use last schedule</Button>
      <FormGrid>
        <Field label="Start date" htmlFor="start"><Input id="start" type="date" /></Field>
        <Field label="Channel" htmlFor="channel"><Select id="channel"><Option value="all">All channels</Option><Option value="social">Social</Option></Select></Field>
      </FormGrid>
      <FormActions><Button type="submit">Save schedule</Button></FormActions>
    </Stack>
    <DescriptionList columns={2} items={[{ term: 'Owner', description: 'Growth team' }, { term: 'Destination', description: long }]} />
    <List><ListItem>Review creative</ListItem><ListItem>Confirm budget</ListItem></List>
  </Stack>;
}

createRoot(document.getElementById('structure-fixture')!).render(<Screen />);
