import type { ComponentProps, ReactNode } from 'react';
import { Tab, TabList, TabPanel, Tabs as AriaTabs } from 'react-aria-components';
import { tabs as tabsStyles } from '@examples/design-system';

type TabDefinition = {
  id: string;
  label: string;
  content: ReactNode;
};

export type TabsProps = Omit<ComponentProps<typeof AriaTabs>, 'children'> & {
  tabs: TabDefinition[];
};

export function Tabs({ tabs, ...props }: TabsProps) {
  return (
    <AriaTabs {...props} className={tabsStyles('root')}>
      <TabList className={tabsStyles('list')}>
        {tabs.map((tab) => (
          <Tab key={tab.id} id={tab.id} className={tabsStyles('tab')}>
            {tab.label}
          </Tab>
        ))}
      </TabList>
      {tabs.map((tab) => (
        <TabPanel key={tab.id} id={tab.id} className={tabsStyles('panel')}>
          {tab.content}
        </TabPanel>
      ))}
    </AriaTabs>
  );
}
