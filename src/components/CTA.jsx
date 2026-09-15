import React from "react";

const CTA = () => {

return <div>
    <section>
  <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="bg-gray-600 dark:bg-slate-800 p-8 md:p-12 lg:px-16 lg:py-24 transition-colors duration-300">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-bold text-white md:text-3xl">
            Lorem, ipsum dolor sit amet consectetur adipisicing elit
          </h2>

          <p className="hidden text-white/90 sm:mt-4 sm:block">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Et, egestas tempus tellus etiam
            sed. Quam a scelerisque amet ullamcorper eu enim et fermentum, augue. Aliquet amet
            volutpat quisque ut interdum tincidunt duis.
          </p>

          <div className="mt-4 md:mt-8">
            <a href="#" className="inline-block rounded-sm border border-white bg-white px-12 py-3 text-sm font-medium text-amber-500 transition hover:bg-transparent hover:text-white focus:ring-3 focus:ring-yellow-400 focus:outline-hidden">
              Get Started Today
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-1 lg:grid-cols-2">
        <img alt="" src="https://images.unsplash.com/photo-1621274790572-7c32596bc67f?ixlib=rb-1.2.1&amp;ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&amp;auto=format&amp;fit=crop&amp;w=654&amp;q=80" className="h-40 w-full object-cover sm:h-56 md:h-full"/>

        <img alt="" src="https://images.unsplash.com/photo-1567168544813-cc03465b4fa8?ixlib=rb-1.2.1&amp;ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&amp;auto=format&amp;fit=crop&amp;w=774&amp;q=80" className="h-40 w-full object-cover sm:h-56 md:h-full"/>
      </div>
    </div>
  </div>
</section>
</div>;

};

export default CTA;

