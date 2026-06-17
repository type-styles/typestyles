import styled from 'styled-components';

const Button = styled.button`
  background: ${(props) => (props.primary ? '#0066ff' : '#6b7280')};
`;

export function App() {
  return <Button primary />;
}
