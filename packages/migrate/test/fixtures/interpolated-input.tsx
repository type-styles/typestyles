import styled from 'styled-components';

const Box = styled.div`
  width: ${(props) => props.width}px;
  height: ${(props) => props.height}px;
  background: ${(props) => props.background};
`;

export function App() {
  return <Box width={200} height={100} background="cornflowerblue" />;
}
