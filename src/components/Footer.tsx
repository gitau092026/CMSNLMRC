const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="w-full border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-4 py-4">
        <p className="text-center text-sm text-muted-foreground">
          © {currentYear} All rights reserved
        </p>
      </div>
    </footer>
  );
};

export default Footer;
