import React from 'react';

const Hero = () => {

   return (
   <section className="bg-white dark:bg-transparent lg:grid lg:h-screen lg:place-content-center">
    <div className="mx-auto w-screen max-w-screen-xl px-4 py-16 sm:px-6 sm:py-24 md:grid md:grid-cols-2 md:items-center md:gap-12 lg:px-8 lg:py-32">

        {/* <!-- Content Part --> */}
        <div className="max-w-prose text-center md:text-left">
            <h1 className="text-3xl  font-bold text-gray-900 dark:text-white sm:text-4xl md:text-5xl">
                Launch your next project with
                <span className="text-indigo-600"> TemplateSee </span>
            </h1>

            <p className="mt-4 text-base text-gray-700 dark:text-gray-300 sm:text-lg md:text-xl">
                Browse high-quality templates crafted for startups, agencies, and creative projects — fully responsive and easy to customize.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <a className="inline-block rounded border border-indigo-600 bg-indigo-600 px-6 py-3 font-medium text-white shadow-sm transition hover:bg-indigo-700" href="#">
                    Explore Templates
                </a>

                <a className="inline-block rounded border border-gray-300 dark:border-gray-700 px-6 py-3 font-medium text-gray-700 dark:text-gray-300 shadow-sm transition hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white" href="#">
                    Learn More
                </a>
            </div>
        </div>

        {/* <!-- Image Part --> */}
        <div className="mt-10 md:mt-0">
            <img src="https://thecodingjourney.com/_next/image?url=%2Fassets%2Fhero.png&amp;w=1080&amp;q=75" alt="Template preview" className="w-[300px] mx-auto"></img>
        </div>

    </div>
</section>

   );

}


export default Hero;



