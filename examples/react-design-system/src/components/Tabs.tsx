import type { JSX, ReactNode } from 'react';
import {
  Tab,
  TabList,
  TabPanel,
  Tabs as AriaTabs,
  type TabsProps as RACTabsProps,
} from 'react-aria-components';
import { tabs as tabsStyles } from '@examples/design-system';

type TabDefinition = {
  id: string;
  label: string;
  content: ReactNode;
};

export type TabsProps = Omit<RACTabsProps, 'children'> & {
  tabs: TabDefinition[];
};

export function Tabs({ tabs, ...props }: TabsProps): JSX.Element {
  return (
    <AriaTabs {...props} className={tabsStyles.root}>
      <TabList className={tabsStyles.list}>
        {tabs.map((tab) => (
          <Tab key={tab.id} id={tab.id} className={tabsStyles.tab}>
            {tab.label}
          </Tab>
        ))}
      </TabList>
      {tabs.map((tab) => (
        <TabPanel key={tab.id} id={tab.id} className={tabsStyles.panel}>
          {tab.content}
        </TabPanel>
      ))}
    </AriaTabs>
  );
}
