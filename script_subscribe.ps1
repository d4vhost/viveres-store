$posContent = Get-Content -Path src/pages/POS.tsx -Raw
$posContent = $posContent -replace "import \{ searchProductsByName, getProduct, getAllProducts \} from '\.\./db';", "import { searchProductsByName, getProduct, getAllProducts, subscribeToProducts } from '../db';"
$posContent = $posContent -replace "getAllProducts\(\)\.then\(setProducts\);", "const unsubscribe = subscribeToProducts(setProducts);
    return () => unsubscribe();"
Set-Content -Path src/pages/POS.tsx -Value $posContent

$prodContent = Get-Content -Path src/pages/Products.tsx -Raw
$prodContent = $prodContent -replace "import \{ getAllProducts, saveProduct, deleteProduct \} from '\.\./db';", "import { getAllProducts, saveProduct, deleteProduct, subscribeToProducts } from '../db';"
$prodContent = $prodContent -replace "getAllProducts\(\)\.then\(setProducts\);", "const unsubscribe = subscribeToProducts(setProducts);
    return () => unsubscribe();"
Set-Content -Path src/pages/Products.tsx -Value $prodContent
