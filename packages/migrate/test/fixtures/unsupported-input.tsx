import styled from 'styled-components';

const Button = styled.button`
  color: ${(props) => props.color};
`;

export function App() {
  return <Button />;
}
