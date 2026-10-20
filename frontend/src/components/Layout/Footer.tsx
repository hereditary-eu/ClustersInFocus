import styles from "./Footer.module.css";

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      Research prototype · Not a medical device · Not for clinical use · Uicons by{" "}
      <a className={styles.link} href="https://www.flaticon.com/uicons">
        Flaticon
      </a>
    </footer>
  );
};

export default Footer;
