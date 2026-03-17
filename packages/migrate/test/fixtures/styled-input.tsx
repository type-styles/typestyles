import styled from 'styled-components';

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  color: white;

  &:hover {
    opacity: 0.9;
  }
`;

export function App() {
  return <Button className="cta">Click me</Button>;
}
