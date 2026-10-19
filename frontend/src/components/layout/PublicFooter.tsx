'use client'

import React from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { useTranslations } from '@/context/LanguageContext'
import { FEATURE_FLAGS } from '@/config/features'
import { Text } from '@/components/ui'

export function PublicFooter() {
  const tFooter = useTranslations('footer')

  return (
    <footer className="border-t border-zinc-200 bg-zinc-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <Logo size="md" priority={false} />
          <Text as="p" size="xs" color="subtle" weight="medium" className="leading-relaxed">
            {tFooter('desc')}
          </Text>
        </div>

        <div className="space-y-2">
          <Text
            as="h4"
            size="xs"
            weight="black"
            color="inherit"
            uppercase
            className="tracking-wider text-zinc-300"
          >
            {tFooter('systemModules')}
          </Text>
          <ul className="space-y-1.5 text-xs text-zinc-400 font-medium">
            <li>
              <Link href="/pricing" className="hover:text-white transition-colors">
                <Text as="span" size="xs" color="inherit">
                  {tFooter('bhms')}
                </Text>
              </Link>
            </li>
            {FEATURE_FLAGS.ENABLE_BHRP && (
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  <Text as="span" size="xs" color="inherit">
                    {tFooter('bhrp')}
                  </Text>
                </Link>
              </li>
            )}
            <li>
              <Link href="/pricing" className="hover:text-white transition-colors">
                <Text as="span" size="xs" color="inherit">
                  {tFooter('vietqr')}
                </Text>
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="hover:text-white transition-colors">
                <Text as="span" size="xs" color="inherit">
                  {tFooter('aiOcr')}
                </Text>
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <Text
            as="h4"
            size="xs"
            weight="black"
            color="inherit"
            uppercase
            className="tracking-wider text-zinc-300"
          >
            {tFooter('customerSupport')}
          </Text>
          <ul className="space-y-1.5 text-xs text-zinc-400 font-medium">
            <li>
              <Link href="/pricing" className="hover:text-white transition-colors">
                <Text as="span" size="xs" color="inherit">
                  {tFooter('pricing')}
                </Text>
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white transition-colors">
                <Text as="span" size="xs" color="inherit">
                  {tFooter('contact')}
                </Text>
              </Link>
            </li>
            <li>
              <Link href="/blog" className="hover:text-white transition-colors">
                <Text as="span" size="xs" color="inherit">
                  {tFooter('blog')}
                </Text>
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-white transition-colors">
                <Text as="span" size="xs" color="inherit">
                  {tFooter('terms')}
                </Text>
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-white transition-colors">
                <Text as="span" size="xs" color="inherit">
                  {tFooter('privacy')}
                </Text>
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <Text
            as="h4"
            size="xs"
            weight="black"
            color="inherit"
            uppercase
            className="tracking-wider text-zinc-300"
          >
            {tFooter('contactTitle')}
          </Text>
          <Text as="p" size="xs" color="subtle" weight="medium">
            <a href="tel:0344265925" className="hover:text-[#2AC1BC] transition-colors">
              <Text as="span" size="xs" color="inherit">
                {tFooter('hotline')}
              </Text>
            </a>
          </Text>
          <Text as="p" size="xs" color="subtle" weight="medium">
            <a
              href="mailto:contact@dormio.site"
              className="hover:text-[#2AC1BC] transition-colors"
            >
              <Text as="span" size="xs" color="inherit">
                {tFooter('email')}
              </Text>
            </a>
          </Text>
          <Text as="p" size="xs" color="subtle" weight="medium">
            {tFooter('address')}
          </Text>
        </div>
      </div>

      <Text
        as="div"
        size="2xs"
        color="subtle"
        weight="medium"
        align="center"
        className="mx-auto max-w-7xl border-t border-zinc-800 mt-8 pt-6"
      >
        {tFooter('rights')}
      </Text>
    </footer>
  )
}
export default PublicFooter

