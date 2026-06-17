import styled from 'styled-components';

const Card = styled.div`
  padding: 16px;

  @media (max-width: 640px) {
    padding: 8px;
  }
`;

export function App() {
  return <Card />;
}
