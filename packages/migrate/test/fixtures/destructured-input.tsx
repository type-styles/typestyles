import styled from 'styled-components';

const Button = styled.button`
  color: ${({ color }) => color};
`;

export function App() {
  return <Button color="red" />;
}
