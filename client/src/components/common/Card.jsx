import { memo } from 'react';
import PropTypes from 'prop-types';
import styles from './Card.module.css';

function Card({
  children,
  className = '',
  padding = 'md',
  interactive = false,
  onClick,
}) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      className={`${styles.card} ${styles[padding]} ${interactive ? styles.interactive : ''} ${className}`}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      {children}
    </Component>
  );
}

function CardHeader({ children, className = '' }) {
  return (
    <div className={`${styles.header} ${className}`}>
      {children}
    </div>
  );
}

function CardBody({ children, className = '' }) {
  return (
    <div className={`${styles.body} ${className}`}>
      {children}
    </div>
  );
}

function CardFooter({ children, className = '' }) {
  return (
    <div className={`${styles.footer} ${className}`}>
      {children}
    </div>
  );
}

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  padding: PropTypes.oneOf(['none', 'sm', 'md', 'lg']),
  interactive: PropTypes.bool,
  onClick: PropTypes.func,
};

CardHeader.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

CardBody.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

CardFooter.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

const MemoCard = memo(Card);
const MemoCardHeader = memo(CardHeader);
const MemoCardBody = memo(CardBody);
const MemoCardFooter = memo(CardFooter);

export default MemoCard;
export { MemoCardHeader as CardHeader, MemoCardBody as CardBody, MemoCardFooter as CardFooter };
