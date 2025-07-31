
document.addEventListener('DOMContentLoaded', () => {

    // === Classe auxiliar para resetar a interface de um produto ===
    class UIHelper {
        static resetProductUI(product) {
            product.querySelector('.count-display').textContent = "0";
            product.querySelector('.btn-div').classList.remove("active");
            product.querySelector('.btn-order-count').classList.remove("active");
            product.querySelector('.product-btn').style.backgroundColor = "";
        }
    }

    
    class Product {
        constructor(name, price, image, quantity) {
            this.name = name;
            this.price = price;
            this.image = image;
            this.quantity = quantity;
        }
    }

    class ProductBuilder {
        constructor() {
            this.name = '';
            this.price = 0;
            this.image = '';
            this.quantity = 0;
        }

        setName(name) {
            this.name = name;
            return this;
        }

        setPrice(price) {
            this.price = price;
            return this;
        }

        setImage(image) {
            this.image = image;
            return this;
        }

        setQuantity(quantity) {
            this.quantity = quantity;
            return this;
        }

        build() {
            return new Product(this.name, this.price, this.image, this.quantity);
        }
    }


    // === Classe ProductItem (Subject no padrão Observer) ===
    class ProductItem {
        constructor(element) {
            this.el = element;
            this.observers = []; // lista de observers (ex: CartManager)
            this.count = 0;
            this.setupElements();
            this.setupEvents();
        }

        // Mapeia os elementos HTML do produto
        setupElements() {
            this.name = this.el.querySelector('.product-name').textContent.trim();
            this.img = this.el.querySelector('.product-img');
            this.unitPrice = parseFloat(this.el.querySelector('.unit-price').textContent.replace(/[^0-9.]/g, '')) || 0;
            this.countDisplay = this.el.querySelector('.count-display');
            this.addToCartBtn = this.el.querySelector('.product-btn');
            this.incrementBtn = this.el.querySelectorAll('.count-btn')[1];
            this.decrementBtn = this.el.querySelectorAll('.count-btn')[0];
            this.btnDiv = this.el.querySelector('.btn-div');
        // Construção do objeto Product via Builder
        this.product = new ProductBuilder()
            .setName(this.name)
            .setPrice(this.unitPrice)
            .setImage(this.img.src)
            .setQuantity(this.count)
            .build();

            this.orderCountDiv = this.el.querySelector('.btn-order-count');
        }

        // Adiciona os eventos de clique (add, +, -)
        setupEvents() {
            this.addToCartBtn.addEventListener('click', () => {
                if (this.count === 0) {
                    this.setCount(1);
                    this.activateUI();
                }
            });

            this.incrementBtn.addEventListener('click', () => {
                this.setCount(this.count + 1);
            });

            this.decrementBtn.addEventListener('click', () => {
                if (this.count > 1) {
                    this.setCount(this.count - 1);
                } else if (this.count === 1) {
                    setTimeout(() => {
                        this.setCount(0);
                        this.resetUI();
                    }, 100);
                }
            });
        }

        // Atualiza o contador e notifica os observadores
        setCount(value) {
            this.count = value;
            this.el.dataset.count = value.toString();
            this.countDisplay.textContent = value.toString();
            
            if (this.product) {
                this.product.quantity = value;
            }
            this.notifyObservers(); // <- Notifica que houve mudança
        }

        // Estiliza o produto como "adicionado ao carrinho"
        activateUI() {
            this.btnDiv.classList.add('active');
            this.orderCountDiv.classList.add('active');
            this.addToCartBtn.style.backgroundColor = "#c73a0f";
            this.img.style.border = "2px solid var(--Red)";
        }

        // Reseta visualmente o produto
        resetUI() {
            this.setCount(0);
            this.img.style.border = "none";
            UIHelper.resetProductUI(this.el);
        }

        // === Padrão Observer ===

        // Adiciona um observador (como CartManager)
        addObserver(observer) {
            this.observers.push(observer);
        }

        // Notifica todos os observadores que houve mudança
        notifyObservers() {
            this.observers.forEach(observer => observer.update());
        }

        // HTML da versão no carrinho
        getCartItemHTML() {
            const finalPrice = (this.unitPrice * this.count).toFixed(2);
            return `
                <div class="cart-item">
                    <div class="cart-item-details">
                        <ul>
                            <h3 class="item-name">${this.name}</h3>
                            <li>
                                <span class="quantity">Qty: ${this.count}</span>
                                <span class="price">@ ${this.unitPrice.toFixed(2)}</span>
                                <span class="price-per-q">$${finalPrice}</span>
                                <span id="close-icon" class="material-symbols-outlined" data-name="${this.name}">cancel</span>
                            </li>
                        </ul>
                    </div>
                </div>
            `;
        }

        // HTML da versão no modal
        getModalItemHTML() {
            const finalPrice = (this.unitPrice * this.count).toFixed(2);
            return `
                <div class="cart-item">
                    <div class="product-modal">
                        <ul>
                            <li class="product-modal-li">
                                <img src="${this.img.src}" alt="product-image" class="product-Img" style="width: 50px; height: 50px; border-radius:10px;">
                                <div class="product-details">
                                    <strong class="itemName-m">${this.name}</strong>
                                    <span>
                                        <span class="quantity-m">Qty: ${this.count}</span>
                                        <span class="price-m">@ ${this.unitPrice.toFixed(2)}</span>
                                    </span>
                                </div>
                                <span class="price-q-m">$${finalPrice}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            `;
        }

        // Diz se o produto está no carrinho (quantidade > 0)
        isInCart() {
            return this.count > 0;
        }
    }

    // === CartManager (Observer do ProductItem) e Singleton ===
    class CartManager {
        static instance = null;

        // Garante uma única instância (Singleton)
        static getInstance() {
            if (!CartManager.instance) {
                CartManager.instance = new CartManager();
            }
            return CartManager.instance;
        }

        constructor() {
            if (CartManager.instance) return CartManager.instance;

            // Referências aos elementos da interface
            this.cartCount = document.querySelector('.item-count');
            this.productList = document.querySelector('.product-li');
            this.modalProductLi = document.querySelector('.product-li-modal');
            this.totalPriceUI = document.querySelector('.totalPrice');
            this.modalPriceUI = document.querySelector('.totalPrice-modal');
            this.dashText = document.querySelector('.dash-text');
            this.dashImage = document.querySelector('.dash-img');
            this.totalPriceContainer = document.querySelector('.final-price');
            this.deliveryText = document.querySelector('.delivery-text-container');
            this.confirmBtn = document.querySelector('.confirm-container');
            this.modalUi = document.querySelector('.modal');
            this.startNewBtn = document.querySelector('.btn');
            this.closeBtn = document.querySelector('.close');

            // Cria os produtos e se registra como observador de cada um
            const productElements = document.querySelectorAll('.product');
            this.products = Array.from(productElements).map(el => {
                const item = new ProductItem(el);
                item.addObserver(this); // <- se inscreve
                return item;
            });

            this.setupEvents();
            this.update();

            CartManager.instance = this;
        }

        // Eventos gerais do carrinho e modal
        setupEvents() {
            document.addEventListener('click', (e) => {
                if (e.target.id === 'close-icon') {
                    const name = e.target.getAttribute('data-name');
                    const product = this.products.find(p => p.name === name);
                    if (product) {
                        product.resetUI();
                    }
                }
            });

            this.confirmBtn.addEventListener('click', () => {
                this.modalUi.classList.add('active');
            });

            this.closeBtn.addEventListener('click', () => {
                this.modalUi.classList.remove('active');
            });

            this.startNewBtn.addEventListener('click', () => {
                setTimeout(() => {
                    this.modalUi.classList.remove('active');
                    this.products.forEach(p => p.resetUI());
                }, 50);
            });

            window.addEventListener('click', (e) => {
                if (e.target === this.modalUi) {
                    this.modalUi.classList.remove('active');
                }
            });
        }

        // Atualiza a contagem e interface do carrinho
        update() {
            let totalCount = 0;
            let total = 0;
            this.productList.innerHTML = '';
            this.modalProductLi.innerHTML = '';

            this.products.forEach(product => {
                if (product.isInCart()) {
                    totalCount += product.count;
                    total += product.unitPrice * product.count;
                    this.productList.innerHTML += product.getCartItemHTML();
                    this.modalProductLi.innerHTML += product.getModalItemHTML();
                }
            });

            this.cartCount.textContent = totalCount;
            this.totalPriceUI.textContent = `$${total.toFixed(2)}`;
            this.modalPriceUI.textContent = `$${total.toFixed(2)}`;
            this.toggleCartUI(totalCount);
        }

        // Mostra ou oculta elementos da UI com base no estado do carrinho
        toggleCartUI(totalCount) {
            const show = totalCount > 0;
            this.productList.classList.toggle('active', show);
            this.totalPriceContainer.classList.toggle('active', show);
            this.deliveryText.classList.toggle('active', show);
            this.confirmBtn.classList.toggle('active', show);
            this.dashText.classList.toggle('active', !show);
            this.dashImage.classList.toggle('active', !show);
        }
    }

    // Inicializa o carrinho (Singleton)
    CartManager.getInstance();
});
